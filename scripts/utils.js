const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const [writeAsync, readAsync] = [fs.writeFile, fs.readFile].map(promisify)

function Err (msg) {
  return { err: msg }
}

const writeFile = async (path, data) => {
  try {
    await writeAsync(path, data)
    return path
  } catch (err) {
    console.log(err)
    return Err('Failed to write file to ', path)
  }
}

const readFile = async (filename) => {
  try {
    const data = await readAsync(filename, 'utf8')
    return data
  } catch (err) {
    console.log(err)
    return Err('Failed to read file ', filename)
  }
}

const readJson = (filename) => {
  try {
    const data = fs.readFileSync(filename, 'utf8')
    const json = JSON.parse(data)
    return json
  } catch (err) {
    console.log(err)
    return Err('Failed to read file ', filename)
  }
}

const fileDir = (filePath) => {
  try {
    return path.dirname(filePath)
  } catch (err) {
    console.log(err)
    return Err('Failed to determine path of file')
  }
}

const readDir = (directory) => {
  try {
    const files = fs.readdirSync(directory)
    return files
  } catch (err) {
    return Err('Failed to read dir ', directory)
  }
}

module.exports = { readDir, readFile, readJson, writeFile, fileDir, Err }
