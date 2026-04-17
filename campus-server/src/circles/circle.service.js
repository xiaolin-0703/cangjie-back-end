const { findUserById } = require('../users/user.repository')
const {
  findCircleById,
  listHotCircles,
  listMyCircles,
  isUserInCircle,
  addCircleMember,
} = require('./circle.repository')

async function getHotCircles() {
  return listHotCircles(20)
}

async function getMyCircles(userId) {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error('用户不存在')
  }

  return listMyCircles(userId)
}

async function joinCircle(userId, circleId) {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error('用户不存在')
  }

  const circle = await findCircleById(circleId)

  if (!circle || circle.status !== 'active') {
    throw new Error('圈子不存在')
  }

  const joined = await isUserInCircle(circleId, userId)

  if (joined) {
    return {
      message: '你已经加入过该圈子',
      circle,
    }
  }

  const updatedCircle = await addCircleMember(circleId, userId)

  return {
    message: '加入圈子成功',
    circle: updatedCircle,
  }
}

module.exports = {
  getHotCircles,
  getMyCircles,
  joinCircle,
}