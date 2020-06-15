const Company = require('../../models/Company');

const bcrypt = require("bcrypt");
const { signToken } = require('../../helpers/signToken');


exports.companyLogin = async (req, res) => {
  const { email, password, remember } = req.body;

  try {
    let user = await Company.findOne({ email });
    
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    const passCorrect = bcrypt.compareSync(password, user.password);
    if (!passCorrect) {
      return res.status(401).json({ msg: 'Email or password not valid' })
      
    } else if (passCorrect) {
      
      res.cookie(process.env.PUBLIC_DOMAIN, {
          maxAge: 432000000,
          httpOnly: true,
          sameSite: 'none',
          secure: true,
        })
        .status(200)
      
      const token = signToken(user, remember);
      res.status(200).json({
        token,
        user: {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          isVerified: user.isVerified
        }
      });

    }



  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Server error" });
  }
}
