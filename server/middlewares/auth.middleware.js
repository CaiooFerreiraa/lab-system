import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Acesso negado. Token não fornecido." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_lab_system");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token inválido ou expirado." });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `O cargo (${req.user.role}) não tem permissão para esta ação.`
      });
    }
    next();
  };
};

/**
 * Verifica se o usuário logado é Admin ou pertence ao Laboratório.
 * Considera role 'admin', setor_nome 'laboratório' ou config_perfil 'laboratório'.
 * @param {object} user - req.user decodificado do token JWT
 * @returns {boolean}
 */
export function isLabOrAdmin(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const setorNome = user.setor_nome?.toLowerCase().trim();
  const configPerfil = user.config_perfil?.toLowerCase().trim();
  return setorNome === 'laboratório' || configPerfil === 'laboratório';
}
