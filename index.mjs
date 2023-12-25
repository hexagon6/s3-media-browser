#!/usr/bin/env node

import path from 'path'
import { promisify } from 'node:util'
import { Parser } from 'xml2js'
import { authify, pickBuckets, pickFiles, pickFolders } from './s3.mjs'
import inquirer from 'inquirer'
import searchList from 'inquirer-search-list'
import { exec } from 'child_process'

inquirer.registerPrompt('search-list', searchList)

const { URL: _url, USERNAME: username, PASSWORD: password } = process.env

const url = new URL(_url)
//   TODO: use prefix query for folders too big (exceeding 10k objects)
//   const path = `?prefix=${await folder}`;
const auth = authify(username)(password)

let headers = new Headers({})
if (username && password) {
  const basic = Buffer.from(username + ':' + password, 'binary').toString(
    'base64',
  )
  headers = new Headers({
    Authorization: `Basic ${basic}`,
  })
}
const res = fetch(url, { headers: headers })

const xml = new Parser()
const parse = promisify(xml.parseString)

const buckets = res
  .then(r => {
    if (r.status === 200) {
    } else if (r.status === 401) {
      console.error(
        `authentication failed for ${url}, missing USERNAME or PASSWORD?`,
      )
      process.exit()
    } else {
      console.log(r.status)
      process.exit()
    }
    return r.text()
  })
  .then(parse)
  .then(pickBuckets)

inquirer
  .prompt([
    {
      type: 'list',
      name: 'bucket',
      message: 'Which bucket?',
      choices: await buckets,
    },
  ])
  .then(async answers => {
    const bucketUrl = `${url}${answers.bucket}`

    fetch(bucketUrl, { headers: headers })
      .then(r => r.text())
      .then(parse)
      .then(pickFiles)
      .then(async files => {
        const folders = pickFolders()(files)
        const { folder } =
          (await folders.length) >= 10
            ? await inquirer.prompt([
                {
                  type: 'search-list',
                  name: 'folder',
                  message: 'Which folder?',
                  choices: ['.', ...(await folders)],
                },
              ])
            : { folder: '.' }
        const _files =
          (await folder) !== '.'
            ? [...(await files)].filter(p => p.startsWith(folder))
            : await files

        inquirer
          .prompt([
            {
              type: 'search-list',
              message: 'Select file',
              name: 'file',
              choices: await _files,
            },
          ])
          .then(({ file }) => {
            // FIXME: this fails if file has no '.' in name
            const extension = file.split('.').pop()
            const prefix = path.basename(file, extension)
            const dirname = path.dirname(file)

            const relevant = _files
              .filter(p => p.startsWith([dirname, prefix].join('/')))
              .filter(f => f.endsWith('.srt'))

            let subtitle_arg
            if (relevant.length == 0) {
              subtitle_arg = []
            } else {
              const { subtitle } =
                relevant.length > 1
                  ? inquirer.prompt([
                      {
                        type: 'list',
                        name: 'subtitle',
                        message: 'Which subtitles?',
                        choices: relevant,
                      },
                    ])
                  : { subtitle: relevant[0] }
              const subtitleUrl = auth(`${bucketUrl}/${subtitle}`)
              subtitle_arg = [`--sub-file=${subtitleUrl}`]
            }

            // console.log({ dirname, extension, prefix, relevant, subtitle_arg })
            const media_url = auth(`${bucketUrl}/${file}`)
            const child = exec(
              ['mpv', '--fs', media_url, ...subtitle_arg].join(' '),
              (error, stdout, stderr) => {
                if (error) {
                  console.log(`error: ${error.message}`)
                  return
                }
                if (stderr) {
                  console.log(`stderr: ${stderr}`)
                  return
                }
                console.log(`stdout: ${stdout}`)
              },
            )
          })
          .catch(console.error)
      })
  })
