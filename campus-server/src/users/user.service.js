async function getMe(userId) {
  const user = await findUserById(userId)
  if (!user) throw new Error('用户不存在')
  return user
}

async function updateProfile(userId, data) {
  const payload = {
    nickname: data.nickname?.trim(),
    avatarUrl: data.avatarUrl || null,
    grade: data.grade?.trim(),
    department: data.department?.trim(),
    phone: data.phone?.trim(),
    bio: data.bio?.trim()
  }

  const profileCompleted = Boolean(
    payload.nickname &&
    payload.grade &&
    payload.department
  )

  const user = await updateUser(userId, {
    ...payload,
    profileCompleted
  })

  return user
}

async function updateMode(userId, identityMode) {
  if (!['real', 'anonymous'].includes(identityMode)) {
    throw new Error('身份模式非法')
  }

  return await updateUser(userId, { identityMode })
}

module.exports = {
  getMe,
  updateProfile,
  updateMode
}