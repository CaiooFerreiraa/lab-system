import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../middlewares/error-handler.js";

export default class AuthController {
  constructor(userRepository) {
    this.userRepository = userRepository;
    this.jwtSecret = process.env.JWT_SECRET || "fallback_secret_lab_system";
  }

  /**
   * Registro de novo usuário (requer autenticação).
   * - Admin: pode criar qualquer role (admin, moderator, user)
   * - Moderator: pode criar apenas role 'user'
   * - User: não pode criar ninguém
   */
  register = asyncHandler(async (req, res) => {
    const { email, senha, matricula, role = 'user', setor } = req.body;
    const requester = req.user; // vem do middleware protect

    // Validações de permissão
    if (requester.role === 'user') {
      return res.status(403).json({ success: false, message: "Você não tem permissão para cadastrar usuários." });
    }

    if (requester.role === 'moderator' && role !== 'user') {
      return res.status(403).json({ success: false, message: "Moderadores só podem cadastrar usuários comuns." });
    }

    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({ success: false, message: "Email e senha são obrigatórios." });
    }

    if (senha.length < 6) {
      return res.status(400).json({ success: false, message: "A senha deve ter no mínimo 6 caracteres." });
    }

    // Verificar se já existe
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: "Email já cadastrado." });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedSenha = await bcrypt.hash(senha, salt);

    // Se informou matrícula, tenta buscar o setor automático do funcionário
    let finalSetor = (setor && setor.toString().trim() !== "") ? setor : null;
    const finalMatricula = (matricula && matricula.trim() !== "") ? matricula : null;

    if (finalMatricula) {
      const empSetor = await this.userRepository.getEmployeeSector(finalMatricula);
      if (empSetor) {
        finalSetor = empSetor;
      }
    }

    const user = await this.userRepository.create({
      email,
      senha: hashedSenha,
      matricula: finalMatricula,
      role,
      setor: finalSetor
    });

    res.status(201).json({ success: true, data: user, message: "Usuário cadastrado com sucesso." });
  });

  /**
   * Login público (não exige autenticação prévia).
   */
  login = asyncHandler(async (req, res) => {
    const { email, senha } = req.body;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciais inválidas." });
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Credenciais inválidas." });
    }

    // Gerar Token com dados completos
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fk_cod_setor: user.fk_cod_setor,
        setor_nome: user.setor_nome,
        fk_funcionario_matricula: user.fk_funcionario_matricula
      },
      this.jwtSecret,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        fk_cod_setor: user.fk_cod_setor,
        setor_nome: user.setor_nome,
        fk_funcionario_matricula: user.fk_funcionario_matricula
      }
    });
  });

  /**
   * Dados do usuário logado.
   */
  me = asyncHandler(async (req, res) => {
    const user = await this.userRepository.findById(req.user.id);
    res.json({ success: true, data: user });
  });

  /**
   * Listar todos os usuários (admin e moderator).
   */
  listUsers = asyncHandler(async (req, res) => {
    const users = await this.userRepository.findAll();
    res.json({ success: true, data: users });
  });

  /**
   * Remover um usuário (somente admin).
   */
  removeUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Não pode deletar a si mesmo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: "Você não pode remover sua própria conta." });
    }

    await this.userRepository.remove(id);
    res.json({ success: true, message: "Usuário removido com sucesso." });
  });

  /**
   * Alterar role de um usuário (somente admin).
   */
  updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'moderator', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Role inválido. Use: ${validRoles.join(', ')}` });
    }

    // Não pode alterar a si mesmo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: "Você não pode alterar seu próprio cargo." });
    }

    await this.userRepository.updateRole(id, role);
    res.json({ success: true, message: "Cargo atualizado com sucesso." });
  });
}
