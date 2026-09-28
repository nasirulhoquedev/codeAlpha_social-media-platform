/**
 * Automated end-to-end API test suite
 * Tests all required features:
 * - User profiles
 * - Posts & comments
 * - Like & follow system
 */

async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  console.log('🧪 Starting Full Feature Automated Tests on', BASE_URL);

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Test Users API
    console.log('\n--- 1. Testing User Profiles & Users API ---');
    const usersRes = await fetch(`${BASE_URL}/api/users`);
    const users = await usersRes.json();
    assert(Array.isArray(users) && users.length >= 4, 'Fetch all users returns at least 4 demo personas');

    const firstUser = users[0];
    const userDetailRes = await fetch(`${BASE_URL}/api/users/${firstUser.id}`);
    const userDetail = await userDetailRes.json();
    assert(userDetail.username === firstUser.username, 'Fetch user profile returns correct user details');
    assert('follower_count' in userDetail && 'following_count' in userDetail, 'User profile contains follower and following counters');

    // 2. Test Posts API
    console.log('\n--- 2. Testing Posts API ---');
    const postsRes = await fetch(`${BASE_URL}/api/posts?feed=for_you`);
    const posts = await postsRes.json();
    assert(Array.isArray(posts) && posts.length >= 5, 'Feed returns populated posts');
    const samplePost = posts[0];
    assert('author_name' in samplePost && 'likes_count' in samplePost, 'Post includes author info and like count');

    // Create a new post
    const createPostRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: firstUser.id,
        content: 'Automated test pulse #TestTag',
        image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900'
      })
    });
    const createdPost = await createPostRes.json();
    assert(createdPost && createdPost.id, 'Creating a post succeeds and returns post with ID');

    // 3. Test Like / Unlike System
    console.log('\n--- 3. Testing Like System ---');
    const user2 = users[1];
    const likeRes = await fetch(`${BASE_URL}/api/posts/${createdPost.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user2.id })
    });
    const likeData = await likeRes.json();
    assert(likeData.liked === true && likeData.likesCount === 1, 'Liking post increments counter to 1');

    const unlikeRes = await fetch(`${BASE_URL}/api/posts/${createdPost.id}/like`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user2.id })
    });
    const unlikeData = await unlikeRes.json();
    assert(unlikeData.liked === false && unlikeData.likesCount === 0, 'Unliking post decrements counter to 0');

    // 4. Test Comments System
    console.log('\n--- 4. Testing Comments System ---');
    const addCommentRes = await fetch(`${BASE_URL}/api/posts/${createdPost.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user2.id,
        content: 'Automated test comment: brilliant work!'
      })
    });
    const commentData = await addCommentRes.json();
    assert(commentData.comment && commentData.commentsCount === 1, 'Adding comment succeeds and updates count to 1');

    const getCommentsRes = await fetch(`${BASE_URL}/api/posts/${createdPost.id}/comments`);
    const commentsList = await getCommentsRes.json();
    assert(commentsList.length === 1 && commentsList[0].content.includes('brilliant work!'), 'Fetching comments returns the newly added comment');

    // 5. Test Follow / Unfollow System
    console.log('\n--- 5. Testing Follow / Unfollow System ---');
    // user2 follows firstUser
    const followRes = await fetch(`${BASE_URL}/api/users/${firstUser.id}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: user2.id })
    });
    const followData = await followRes.json();
    assert(followData.following === true, 'Following user succeeds');

    // Check following feed
    const followingFeedRes = await fetch(`${BASE_URL}/api/posts?feed=following&viewer_id=${user2.id}`);
    const followingFeed = await followingFeedRes.json();
    assert(Array.isArray(followingFeed) && followingFeed.some(p => p.user_id === firstUser.id), 'Following feed shows posts by followed user');

    // 6. Test Stats API
    console.log('\n--- 6. Testing Platform Analytics Stats ---');
    const statsRes = await fetch(`${BASE_URL}/api/stats`);
    const stats = await statsRes.json();
    assert(stats.users >= 4 && stats.posts >= 6 && stats.comments >= 1, 'Platform stats returns valid aggregate numbers');

    // Clean up created post
    await fetch(`${BASE_URL}/api/posts/${createdPost.id}`, { method: 'DELETE' });
    console.log('\nCleaned up test post.');

    console.log(`\n========================================`);
    console.log(`Test Summary: ${passed}/${total} assertions passed!`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  }
}

runTests();
