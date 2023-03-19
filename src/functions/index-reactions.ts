import got from 'got'

import { MERKLE_REQUEST_OPTIONS } from '../merkle.js'
import supabase from '../supabase.js'
import { Reaction, FlattenedReaction, MerkleResponse, Profile, FlattenedRecast } from '../types/index'
import { breakIntoChunks } from '../utils.js'

/**
 * Index the likes across Farcaster and insert them into Supabase
 * @param limit The max number of recent likes to index
 */
export async function indexAllReactions(casts: string[], limit?: number) {
  const startTime = Date.now()
  const count = await getAllLikes(casts, limit)

  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000

  if (duration > 60) {
    // If it takes more than 60 seconds, log the duration so we can optimize
    console.log(`Updated ${count} likes in ${duration} seconds`)
  }
}

async function formatAndSave({allLikes}: {allLikes?: Reaction[]}) {
  const formattedLikes: FlattenedReaction[] = (allLikes || []).map((c) => {
    return {
      hash: c.hash,
      reactor_id: c.reactor.fid,
      reactor_user_name: c.reactor.username,
      reactor_display_name: c.reactor.displayName,
      timestamp: new Date(c.timestamp),
      cast_hash: c.castHash,
    }
  })

  // Break formattedLikes into chunks of 1000
  let chunks = breakIntoChunks(formattedLikes, 1000)

  // Upsert each chunk into the Supabase table
  for (const chunk of chunks) {
    const { error } = await supabase.from('likes').upsert(chunk, {
      onConflict: 'hash',
    })

    if (error) {
      console.log(error)
    }
  }
}

/**
 * Get the latest likes from the Merkle API. 100k likes every ~35 seconds on local machine.
 * @param limit The maximum number of likes to return. If not provided, all likes will be returned.
 * @returns An array of all likes on Farcaster
 */
async function getAllLikes(casts: string[], limit?: number): Promise<number> {
  const chunks = breakIntoChunks(casts, 250);
  let count = 0;

  for (const castChunk of chunks) {
    // console.log("fetching likes for :", castChunk);
    const likes: Reaction[] = (await Promise.all(castChunk.map((c: string) => getLikesForCast(c)))).flat();

    await formatAndSave({allLikes: likes});
    count += castChunk.length;

    await new Promise(r => setTimeout(r, 15000));

    console.log(`[${(count * 100 / casts.length).toFixed(2)}%] ${count} of ${casts.length} processed`);
    // console.log(likes);
  }

  return count;
}

async function getLikesForCast(cast: string): Promise<Reaction[]> {
  const allLikes: Reaction[] = new Array()

  let endpoint = buildLikeEndpoint(cast)

  // console.log("like endpoint: ", endpoint);

  while (true) {
    try {
      const _response = await got(endpoint, MERKLE_REQUEST_OPTIONS).json()
      const response = _response as MerkleResponse
      const likes = response.result.likes

      // console.log("response for", cast, likes);

      if (!likes) break

      for (const like of likes) {
        allLikes.push(like)
      }

      // If there are more likes, get the next page
      const cursor = response.next?.cursor
      if (cursor) {
        endpoint = buildLikeEndpoint(cast, cursor)
      } else {
        break
      }
    } catch (e) {
      console.log("******* error for",cast, e);
      break;
    }
  }
  // console.log("got likes for", cast, allLikes);

  return allLikes
}

/**
 * Helper function to build the profile endpoint with a cursor
 * @param cursor
 */
function buildLikeEndpoint(cast: string, cursor?: string): string {
  return `https://api.warpcast.com/v2/cast-likes?castHash=${cast}&limit=100${cursor ? `&cursor=${cursor}` : ''
    }`
}
