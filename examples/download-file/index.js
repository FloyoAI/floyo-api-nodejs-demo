const path = require('node:path')
const { mkdir, writeFile } = require('node:fs/promises')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const CDN_BASE_URL = process.env.CDN_URL
const API_KEY = process.env.API_KEY
const FILE_ID = 'file_APJU4Dxxxxxxxxxx' // <-- Use your own file id here.

/**
 * Get the original filename from the Content-Disposition header or the fallback name.
 * @param {*} headers
 * @param {*} fallbackName
 * @returns The original filename from the Content-Disposition header or the fallback name.
 */
function getOriginalFilename(headers, fallbackName) {
  const contentDisposition = headers.get('content-disposition')
  if (!contentDisposition) return fallbackName

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return path.basename(decodeURIComponent(utf8Match[1]))

  const basicMatch = contentDisposition.match(/filename="([^"]+)"/i)
  if (basicMatch?.[1]) return path.basename(decodeURIComponent(basicMatch[1]))

  return fallbackName
}

/**
 * Download the file from the CDN.
 */
async function downloadFile(fileId) {
  if (!CDN_BASE_URL) throw new Error('CDN_BASE_URL is not set. Please set it in the .env file.')
  if (!API_KEY) throw new Error('API_KEY is not set. Please set it in the .env file.')

  const response = await fetch(`${CDN_BASE_URL}/${fileId}/download`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `❌ Download failed (${response.status} - ${response.statusText}): ${errorText}`,
    )
  }

  // Create the output directory if it doesn't exist.
  const outputDir = path.resolve(__dirname, '../../data/downloads')
  await mkdir(outputDir, { recursive: true })

  // Get the original filename from the Content-Disposition header or the fallback name.
  const filename = getOriginalFilename(response.headers, `${fileId}`)
  const outputPath = path.join(outputDir, filename)

  // Write the file to the output directory.
  const arrayBuffer = await response.arrayBuffer()
  await writeFile(outputPath, Buffer.from(arrayBuffer))
  console.log(`✅ File downloaded successfully to: ${outputPath}`)
}

downloadFile(FILE_ID).catch((error) => {
  console.error('❌ Download failed:', error)
  process.exit(1)
})
