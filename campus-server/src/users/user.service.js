const {
  findUserById,
  updateUser,
  submitStudentAuth,
} = require('./user.repository')

function normalizeOptionalString(value) {
  if (value === undefined) return undefined
  if (value === null) return null

  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

function ensureEditableUser(user) {
  if (!user) {
    throw new Error('用户不存在')
  }

  if (user.status !== 'active') {
    throw new Error('当前账号状态异常，无法操作')
  }
}

function validateProfilePayload(payload) {
  if (payload.nickname !== undefined && payload.nickname !== null) {
    if (payload.nickname.length < 2 || payload.nickname.length > 20) {
      throw new Error('昵称长度应为 2 到 20 个字符')
    }
  }

  if (payload.avatarUrl !== undefined && payload.avatarUrl !== null) {
    if (payload.avatarUrl.length > 255) {
      throw new Error('头像地址长度不能超过 255 个字符')
    }
  }

  if (payload.grade !== undefined && payload.grade !== null) {
    if (payload.grade.length > 20) {
      throw new Error('年级长度不能超过 20 个字符')
    }
  }

  if (payload.department !== undefined && payload.department !== null) {
    if (payload.department.length > 100) {
      throw new Error('院系长度不能超过 100 个字符')
    }
  }

  if (payload.phone !== undefined && payload.phone !== null) {
    if (!/^1\d{10}$/.test(payload.phone)) {
      throw new Error('手机号格式不正确')
    }
  }

  if (payload.bio !== undefined && payload.bio !== null) {
    if (payload.bio.length > 255) {
      throw new Error('简介长度不能超过 255 个字符')
    }
  }
}

async function getMe(userId) {
  const user = await findUserById(userId)
  if (!user) {
    throw new Error('用户不存在')
  }
  return user
}

async function updateProfile(userId, data) {
  const input = data || {}
  const payload = {}

  if (Object.prototype.hasOwnProperty.call(input, 'nickname')) {
    payload.nickname = normalizeOptionalString(input.nickname)
  }

  if (Object.prototype.hasOwnProperty.call(input, 'avatarUrl')) {
    payload.avatarUrl = normalizeOptionalString(input.avatarUrl)
  }

  if (Object.prototype.hasOwnProperty.call(input, 'grade')) {
    payload.grade = normalizeOptionalString(input.grade)
  }

  if (Object.prototype.hasOwnProperty.call(input, 'department')) {
    payload.department = normalizeOptionalString(input.department)
  }

  if (Object.prototype.hasOwnProperty.call(input, 'phone')) {
    payload.phone = normalizeOptionalString(input.phone)
  }

  if (Object.prototype.hasOwnProperty.call(input, 'bio')) {
    payload.bio = normalizeOptionalString(input.bio)
  }

  const currentUser = await findUserById(userId)
  ensureEditableUser(currentUser)

  if (Object.keys(payload).length === 0) {
    throw new Error('没有可更新的资料字段')
  }

  validateProfilePayload(payload)

  const finalNickname =
    payload.nickname !== undefined ? payload.nickname : currentUser.nickname
  const finalGrade =
    payload.grade !== undefined ? payload.grade : currentUser.grade
  const finalDepartment =
    payload.department !== undefined ? payload.department : currentUser.department

  payload.profileCompleted = Boolean(
    finalNickname && finalGrade && finalDepartment
  )

  const user = await updateUser(userId, payload)

  if (!user) {
    throw new Error('用户不存在')
  }

  return user
}

async function updateMode(userId, identityMode) {
  const currentUser = await findUserById(userId)
  ensureEditableUser(currentUser)

  if (!['real', 'anonymous'].includes(identityMode)) {
    throw new Error('身份模式非法')
  }

  const user = await updateUser(userId, { identityMode })

  if (!user) {
    throw new Error('用户不存在')
  }

  return user
}

async function submitAuth(userId, data) {
  const input = data || {}

  const realName = normalizeOptionalString(input.realName)
  const studentNo = normalizeOptionalString(input.studentNo)
  const grade = normalizeOptionalString(input.grade)
  const department = normalizeOptionalString(input.department)

  if (!realName || !studentNo || !grade || !department) {
    throw new Error('真实姓名、学号、年级、院系不能为空')
  }

  if (realName.length > 50) {
    throw new Error('真实姓名长度不能超过 50 个字符')
  }

  if (studentNo.length > 50) {
    throw new Error('学号长度不能超过 50 个字符')
  }

  if (grade.length > 20) {
    throw new Error('年级长度不能超过 20 个字符')
  }

  if (department.length > 100) {
    throw new Error('院系长度不能超过 100 个字符')
  }

  const currentUser = await findUserById(userId)
  ensureEditableUser(currentUser)

  if (currentUser.authStatus === 'pending') {
    throw new Error('你已提交认证申请，请勿重复提交')
  }

  if (currentUser.authStatus === 'verified' || currentUser.studentVerified) {
    throw new Error('你已完成学生认证')
  }

  let user = await submitStudentAuth(userId, {
    realName,
    studentNo,
    grade,
    department,
  })

  if (!user) {
    throw new Error('认证提交失败')
  }

  const profileCompleted = Boolean(
    user.nickname && user.grade && user.department
  )

  if (Boolean(user.profileCompleted) !== profileCompleted) {
    user = await updateUser(userId, { profileCompleted })
  }

  return user
}

module.exports = {
  getMe,
  updateProfile,
  updateMode,
  submitAuth,
}