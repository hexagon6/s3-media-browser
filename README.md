# README s3-media-browser

## Description

> s3-media-browser lets you watch media stored on s3.

This is a node.js-based commandline tool to select movies from a big list of files stored on s3 object storage. It can select subtitle files and access Base Auth protected endpoints.

## Features

- Access media files stored on s3
- Access media files protected with [HTTP Base Auth](https://www.rfc-editor.org/rfc/rfc7617)
- Select subtitle files automatically (based on media file path, .srt file extension required)
- Select from subfolders if there are more than 10 in the first hierarchy level
- Fuzzy Search inside terminal for path & file names
- Starts mpv in fullscreen (--fs) and with subtitle parameter (--subtitle=...)

## Requirements

- UNIX filesystem (linux or macosx)
- mpv
- nodejs (21.5+)

## Installation

- clone this repo
- Install dependencies: `npm install`

## Setup

Configuration happens with environment-variables.

### Environment variables

Required:

- URL: e.g. `https://mybucketserver.example.com`

Optional:

- USERNAME: e.g. `mickey`
- PASSWORD: just a string which only you know

## Run

`node index.mjs`

or if you use a .env file:

`node -r dotenv-safe/config index.mjs`
