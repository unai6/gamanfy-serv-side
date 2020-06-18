const Company = require('../../models/Company');
const jwt = require('jsonwebtoken');

exports.getDashboard =  async (req, res) => {

    try {
        const { companyId } = req.params
        let getUserData = await Company.findById(companyId);

        if (getUserData.isVerified === true) {
            jwt.verify(req.token, process.env.SECRET_KEY, { companyId }, (err, authorizedData) => {
                if (err) {

                    res.status(403).json('Protected route, you need an auth Token');
                } else {

                    res.json({
                        message: 'Successful login',
                        authorizedData,

                    });

                    res.status(200).json('Successful connection to protected route');
                    res.json(getUserData)
                }
            });
        } else {
            res.status(404).json('User is not verified')
        }
    } catch (error) { res.status(404).json('User is not verified') }


};

