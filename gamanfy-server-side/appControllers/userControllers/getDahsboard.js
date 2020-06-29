const jwt = require('jsonwebtoken');
const InfluencerUser = require('../../models/InfluencerUser');

exports.getUserDashboard = async (req, res) => {
    try {
        const { userId } = req.params
        let getUserData = await InfluencerUser.findById(userId).populate('companyUser');

        if (getUserData.isVerified === true) {
            jwt.verify(req.token, process.env.SECRET_KEY, { userId }, (err, authorizedData) => {
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


}