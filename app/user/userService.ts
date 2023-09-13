import UserSchema from './userSchema';

const getUserDetails = async (_id: string) => {
  const user = await UserSchema.findById(_id);
  return user;
};

const updatePoints = async (userId, credit, pointsCount) => {
  const user = await UserSchema.findByIdAndUpdate(userId);

  if (credit) user.sandboxPoints += pointsCount;
  else user.sandboxPoints -= pointsCount;

  await user.save();
};

export = { getUserDetails, updatePoints };
