import { getCurrentTopic } from '../../utils/db.js';

export default defineEventHandler(async () => {
  const topicId = await getCurrentTopic();
  return { topicId };
});
