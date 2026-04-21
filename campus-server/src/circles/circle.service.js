const {
  listHotCircles,
  listCircles,
  findCircleById,
  hasJoinedCircle,
  joinCircle,
  createCircle,
  addCircleMember,
  listCirclePosts,
  findPostById,
  createPost,
} = require('./circle.repository')

async function getHotCircles(userId) {
  const circles = await listHotCircles(3)
  return Promise.all(
    circles.map(async (circle) => ({
      ...circle,
      joined: await hasJoinedCircle(circle.id, userId),
    }))
  )
}

async function getCircles(userId) {
  const circles = await listCircles(20)
  return Promise.all(
    circles.map(async (circle) => ({
      ...circle,
      joined: await hasJoinedCircle(circle.id, userId),
    }))
  )
}

async function createCircleByUser(userId, data) {
  const name = String(data.name || '').trim()
  const description = String(data.description || '').trim()
  const isPublic = data.isPublic !== false

  if (!name) {
    throw new Error('圈子名称不能为空')
  }

  if (name.length > 100) {
    throw new Error('圈子名称不能超过 100 个字符')
  }

  if (description.length > 255) {
    throw new Error('圈子简介不能超过 255 个字符')
  }

  const circleId = await createCircle({
    name,
    description,
    creatorId: userId,
    isPublic,
  })

  await addCircleMember(circleId, userId, 'owner')

  const circle = await findCircleById(circleId)

  return {
    message: '圈子创建成功',
    circle: {
      ...circle,
      joined: true,
    },
  }
}

async function getCircleDetail(userId, circleId) {
  const circle = await findCircleById(circleId)
  if (!circle) {
    throw new Error('圈子不存在')
  }

  return {
    ...circle,
    joined: await hasJoinedCircle(circle.id, userId),
  }
}

async function joinCircleByUser(userId, circleId) {
  const circle = await findCircleById(circleId)
  if (!circle) {
    throw new Error('圈子不存在')
  }

  const joined = await hasJoinedCircle(circleId, userId)
  if (joined) {
    return {
      message: '你已经加入过该圈子',
      circle: {
        ...circle,
        joined: true,
      },
    }
  }

  const updatedCircle = await joinCircle(circleId, userId)

  return {
    message: '加入成功',
    circle: {
      ...updatedCircle,
      joined: true,
    },
  }
}

async function getCirclePostsByUser(userId, circleId) {
  const circle = await findCircleById(circleId)
  if (!circle) {
    throw new Error('圈子不存在')
  }

  const posts = await listCirclePosts(circleId, 20)

  return {
    circle: {
      ...circle,
      joined: await hasJoinedCircle(circle.id, userId),
    },
    posts,
  }
}

async function createPostByUser(userId, circleId, data) {
  const circle = await findCircleById(circleId)
  if (!circle) {
    throw new Error('圈子不存在')
  }

  const joined = await hasJoinedCircle(circleId, userId)
  if (!joined) {
    throw new Error('请先加入圈子再发帖')
  }

  const title = String(data.title || '').trim()
  const content = String(data.content || '').trim()

  if (!title) {
    throw new Error('帖子标题不能为空')
  }

  if (!content) {
    throw new Error('帖子内容不能为空')
  }

  if (title.length > 100) {
    throw new Error('帖子标题不能超过 100 个字符')
  }

  const postId = await createPost({
    circleId,
    userId,
    title,
    content,
  })

  const post = await findPostById(postId)

  return {
    message: '帖子发布成功',
    post,
  }
}

module.exports = {
  getHotCircles,
  getCircles,
  createCircleByUser,
  getCircleDetail,
  joinCircleByUser,
  getCirclePostsByUser,
  createPostByUser,
}