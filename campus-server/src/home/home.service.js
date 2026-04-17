const { findUserById, listRecommendedUsersForHome } = require('../users/user.repository')
const { listHotCircles } = require('../circles/circle.repository')
const { listFeaturedEvents } = require('../events/event.repository')

function getDisplayName(user) {
  if (user.nickname && String(user.nickname).trim()) return user.nickname
  if (user.realName && String(user.realName).trim()) return user.realName
  return '同学'
}

function formatEventStatusText(event) {
  const deadline = event.signupDeadline ? new Date(event.signupDeadline).getTime() : null

  if (deadline && Date.now() > deadline) {
    return '报名已截止'
  }

  if (event.capacity > 0) {
    const left = Math.max(0, event.capacity - event.registeredCount)
    if (left === 0) {
      return '名额已满'
    }
    return `还剩 ${left} 个名额`
  }

  return '正在报名中'
}

async function getHomeFeed(userId) {
  const me = await findUserById(userId)

  if (!me) {
    throw new Error('用户不存在')
  }

  const recommendedUsers = await listRecommendedUsersForHome(userId, 10)
  const hotCircles = await listHotCircles(6)
  const featuredEvents = await listFeaturedEvents(6)

  return {
    user: {
      id: me.id,
      nickname: getDisplayName(me),
      unreadCount: 0,
    },
    recommendedUsers: recommendedUsers.map(item => ({
      id: item.id,
      nickname: item.nickname || item.realName || '同学',
      department: item.department || '未填写院系',
      grade: item.grade || '未填写年级',
      matchRate: item.matchRate,
      tags: item.tags || [],
      online: Boolean(item.online),
    })),
    hotCircles: hotCircles.map(item => ({
      id: item.id,
      name: item.name,
      memberCount: item.memberCount,
      description: item.description || '暂无简介',
    })),
    featuredEvents: featuredEvents.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      timeText: item.startTimeText,
      location: item.location || '待定',
      statusText: formatEventStatusText(item),
    })),
  }
}

module.exports = {
  getHomeFeed,
}