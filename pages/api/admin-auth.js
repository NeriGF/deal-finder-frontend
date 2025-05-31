module.exports = async (req, res) => {
  const { password } = req.body || {};

  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ auth: true, token: "admin-ok" });
  }

  return res.status(401).json({ auth: false });
};
