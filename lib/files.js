const path = require('node:path')
const dotenv = require('dotenv')
const { openAsBlob } = require('node:fs')
const { readFile } = require('node:fs/promises')
const { fileTypeFromBuffer } = require('file-type')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const CDN_BASE_URL = process.env.CDN_URL
const API_KEY = process.env.API_KEY

async function uploadFile(filePath, destinationPath, filename, onConflict) {
  if (!CDN_BASE_URL) throw new Error('CDN_BASE_URL is not set. Please set it in the .env file.')
  if (!API_KEY) throw new Error('API_KEY is not set. Please set it in the .env file.')

  // Create a file buffer from the file path and get the original file name and its mime type
  const fileBuffer = await readFile(filePath)
  const originalName = path.basename(filePath)
  const fileType = await fileTypeFromBuffer(fileBuffer)
  const mimeType = fileType?.mime ?? 'application/octet-stream'

  // Create a new Blob from the file buffer to be sent to the server
  const fileBlob = await openAsBlob(filePath, { type: mimeType })

  // Create a new FormData object to send the file to the server and append the file.
  // The "file" parameter is required and must be a Blob object.
  const formData = new FormData()
  formData.append('file', fileBlob, originalName)

  // OPTIONAL: Append the destination "path" parameter. The root for all uploads is /inputs.
  // In this example the file will be uploaded to /inputs/api/uploads.
  // If no path is provided, the file will be uploaded to the root of the /inputs directory.
  if (destinationPath) formData.append('path', destinationPath)

  // OPTIONAL: Append the "filename" parameter if you want to rename the file on the server.
  // This is not very useful when uploading from NodeJS because the file name is already set
  // when appending the blob to the FormData object, at that point you can use any filename.
  // This filename is useful for browser uploads which are yet no allowed.
  // But you can still use it from NodeJS! The filename param will have priority over the original filename.
  if (filename) formData.append('filename', filename)

  // OPTIONAL: Append the "on_conflict" parameter if you want to handle filenme conflicts.
  // Possible values are: "rename" and "fail". Default is "fail".
  // "rename" will rename the file to a unique name, appending a incrementing number to the end of the filename.
  // "fail" will return an error if a file with the same name already exists on the destination path.
  // If the file fails to upload because of a name conflict you'll get a response like this:
  // {
  //     error: 'Upload Failed',
  //     message: 'A file with the same name already exists at the requested path.',
  //     suggestion: 'beautiful-landscape (1).png'
  // }
  // As you can see, the suggestion is a suggested new filename that you can use to upload the file again.
  if (onConflict && ['rename', 'fail'].includes(onConflict))
    formData.append('on_conflict', onConflict)

  // Send the file to the server by making a POST request to the Floyo CDN /upload endpoint.
  // Don't forget to set the Authorization header with the API key.
  const response = await fetch(`${CDN_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    body: formData,
  })

  const data = await response.json()

  if (response.ok) {
    return { success: true, data: data, status: response.status, statusText: response.statusText }
  } else {
    return { success: false, data: data, status: response.status, statusText: response.statusText }
  }
}

const files = {
  uploadFile: uploadFile,
}

module.exports = files
