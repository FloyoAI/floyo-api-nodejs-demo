const path = require('node:path')
// Import the API module
const api = require('../../lib/api')
// Import the Files module
const files = require('../../lib/files')

// Finished run statuses
const FINISHED_RUN_STATUSES = [
  'done',
  'failed',
  'cancelled',
  'insufficient_balance',
  'insufficient_api_credits',
]

// Path to the file to upload
const FILE_PATH = path.resolve(__dirname, '../../data/desert_motorbike.png')
const FILE_NAME = 'desert_motorbike.png'

// Workflow to run, we'll replace the %INPUT_IMAGE_PATH% placeholder with the input_path.
const WORKFLOW = require('../../data/upload_and_run_workflow.json')

/**
 * Uploads a file to the Floyo CDN and runs a workflow with the uploaded image as input.
 */
async function uploadAndRunWithInput() {
  // Let's start by uploading the file to the Floyo CDN.
  console.log('📤 Uploading file to Floyo CDN...')
  const {
    success,
    data: uploadData,
    status: uploadStatus,
    statusText: uploadStatusText,
  } = await files.uploadFile(FILE_PATH, '/api/uploads', FILE_NAME, 'rename')

  if (!success) {
    // Upload failed. Print the error and return.
    console.error(`❌ Upload failed with status ${uploadStatus} - ${uploadStatusText}`)
    console.error('Response data:', uploadData)
    return
  }

  console.log(`✅ File ${FILE_NAME} uploaded successfully!`)

  // File uploaded successfully, let's save the input_path to use it in the run.
  const inputPath = uploadData.input_path

  // Replace the %INPUT_IMAGE_PATH% placeholder with the uploaded image input_path.
  // This placeholder is used in the workflow to specify the input image for the workflow.
  const workflowWithInputPath = JSON.stringify(WORKFLOW).replace('%INPUT_IMAGE_PATH%', inputPath)

  // Create a new run with the workflow using the uploaded file as an input.
  console.log(`🔍 Running workflow with input...`)

  const createRunResponse = await api.post('/runs', {
    name: 'Floyo API - Upload and run with input',
    workflow: JSON.parse(workflowWithInputPath),
  })

  const newRun = await createRunResponse.json()

  if (!createRunResponse.ok) {
    console.log(
      `❌ Failed to create run with status: ${createRunResponse.status} - ${createRunResponse.statusText}`,
    )
    return
  }

  console.log(`✅ Run "${newRun.name}" created successfully with id = ${newRun.id}`)

  // Poll for run status until it is finished by making a GET request to the /runs/{id} endpoint.
  console.log('\n🔍 Polling for run status until it is finished...')
  let run = null
  while (!FINISHED_RUN_STATUSES.includes(run?.status)) {
    const runResponse = await api.get(`/runs/${newRun.id}`)

    run = await runResponse.json()

    if (!runResponse.ok) {
      // Non 2xx response means the run status retrieval failed
      console.log(`HTTP error! status: ${runResponse.status}`)
      console.log(run)
      return
    }

    console.log(`   Run "${run.name}" (${run.id}) is in status: ${run.status}`)

    // Add a delay of 2.5 seconds between polling
    await new Promise((resolve) => setTimeout(resolve, 2500))
  }

  if (run.status !== 'done') {
    // Run didn't finish successfully. Print out the errors.
    console.log('❌ Run failed with status:', run.status)
    console.log(run.errors)
    return
  }

  console.log('✅ Run completed successfully!')

  // STEP 3:
  // Get the run data by making a GET request to the /runs/{runId} endpoint.
  // By default, the response will not include the outputs.presigned_url field.
  // Use the "expand=outputs.presigned_url" query parameter to get the presigned URLs
  // for the outputs and the "presigned_url_expires_in=XXX" query parameter to set the
  // expiration time to XXX seconds.
  console.log('\n🔍 Getting run data with expanded outputs...')

  const runResponse = await api.get(
    `/runs/${newRun.id}?expand=outputs.presigned_url&presigned_url_expires_in=600`,
  )

  const finishedRun = await runResponse.json()
  if (!runResponse.ok) {
    // Non 2xx response means the run data retrieval failed
    console.log(`HTTP error! status: ${runResponse.status}`)
    console.log(finishedRun)
    return
  }

  // Print out the run data
  const { id, name, status, flotime_ms, outputs } = finishedRun

  console.log(`   RUN NAME: "${name}"`)
  console.log(`   RUN ID: ${id}`)
  console.log(`   RUN STATUS: ${status}`)
  console.log(`   RUN FLO TIME USED: ${flotime_ms}ms`)
  console.log(`   RUN OUTPUTS:`)
  outputs.forEach((output) => {
    console.log(
      `     💾  ${output.file_name} (${output.mime_type} / ${output.size_bytes} bytes) - id: ${output.id}`,
    )
    console.log(`         Presigned URL: ${output.presigned_url}`)
  })
}

uploadAndRunWithInput().catch((error) => {
  console.error('Upload and run with input failed:', error)
  process.exit(1)
})
