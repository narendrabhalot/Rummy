const User = require('../model/User');
//const aws = require('../AWS/aws')

// Controller function for creating a new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, age, password } = req.body;
    const user = new User({ name, email, age, password });
    await user.save();
    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function for listing all users
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function for reading a user by ID
exports.readUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function for updating a user by ID
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, age } = req.body;
    const user = await User.findByIdAndUpdate(userId, { name, email, age }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function for deleting a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndRemove(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports. uploadImage = async (req, res) => {
//   try {
//     console.log(req.file[0])
//       let imageUrl = await aws.uploadImage(req.file[0])
//       req.body.image = imageUrl
//       req.body.userId = req.params.userId  // automatically store userId due to authentication user
//       let saveData = await User.create(req.body)
//       return res.status(201).send({ status: true, msg: "Image uploaded successfully", Image: saveData })
//   } catch (error) {
//       return res.status(500).send({ status: false, msg: error.message })
//   }
// }
