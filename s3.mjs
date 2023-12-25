import {
  filter,
  flatten,
  map,
  pipe as _,
  split,
  take,
  tap,
  test,
  uniq,
} from 'ramda'

export const pickBuckets = o =>
  o?.ListAllMyBucketsResult?.Buckets[0].Bucket.map(({ Name }) => Name[0]) || []

export const pickFiles = ({ ListBucketResult }) =>
  ListBucketResult.Contents.map(({ Key }) => Key[0])

export const pickFolders = (level = 1) =>
  _(filter(test(/\//)), map(_(split('/'), take(level))), uniq, flatten)

export const authify = username => password => url => {
  const _url = new URL(url)
  if (username) {
    _url.username = username
  }
  if (password) {
    _url.password = password
  }
  return _url.href
}
