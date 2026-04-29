// Import the API module
const api = require('./lib/api');

// Import the basic API JSON workflow as JSON
const BASIC_WORKFLOW = require('./data/base_workflow.json')

// Define the finished run statuses
const FINISHED_RUN_STATUSES = [
    "done", 
    "failed", 
    "cancelled", 
    "insufficient_balance", 
    "insufficient_api_credits"
];


const floyoAPIDemo = async () => {
    console.log("🔍 Starting Floyo API Demo...")
    console.log("💻 API Base Url is:", process.env.API_URL);

    // STEP 1: 
    // Create a new run by making a POST request to the /runs endpoint.
    const createRunResponse = await api.post(
        "/runs", 
        { name: "Floyo API - Demo test run", workflow: BASIC_WORKFLOW }
    );

    const newRun = await createRunResponse.json();

    if (!createRunResponse.ok) {
        // Non 2xx response means the run creation failed
        console.log(`HTTP error! status: ${createRunResponse.status}`);
        console.log(newRun);
        return;
    }

    console.log(`✅ Run "${newRun.name}" created successfully with id = ${newRun.id}`)
    
    // STEP 2: 
    // Poll for run status until it is finished by making a GET request to the /runs/{id} endpoint.
    console.log("\n🔍 Polling for run status until it is finished...")
    let run = null;
    while (!FINISHED_RUN_STATUSES.includes(run?.status)) {
        const runResponse = await api.get(`/runs/${newRun.id}`);

        run = await runResponse.json();

        if (!runResponse.ok) {
            // Non 2xx response means the run status retrieval failed
            console.log(`HTTP error! status: ${runResponse.status}`);
            console.log(run);
            return;
        }

        const { id, name, status } = run;
        console.log(`   Run "${name}" (${id}) is in status: ${status}`);

        // Add a delay of 2.5 seconds between polling
        await new Promise(resolve => setTimeout(resolve, 2500));
    }

    if (run.status !== "done") {
        // Run didn't finish successfully. Print out the errors.
        console.log("❌ Run failed with status:", run.status)
        console.log(run.errors);
        return;
    }
     
    console.log("✅ Run completed successfully!")
    

    // STEP 3: 
    // Get the run data by making a GET request to the /runs/{runId} endpoint.
    // By default, the response will not include the outputs.presigned_url field.
    // Use the "expand=outputs.presigned_url" query parameter to get the presigned URLs 
    // for the outputs and the "presigned_url_expires_in=XXX" query parameter to set the 
    // expiration time to XXX seconds.
    console.log("\n🔍 Getting run data with expanded outputs...")

    const runResponse = await api.get(
        `/runs/${newRun.id}?expand=outputs.presigned_url&presigned_url_expires_in=600`, 
    );

    const finishedRun = await runResponse.json();
    if (!runResponse.ok) {
        // Non 2xx response means the run data retrieval failed
        console.log(`HTTP error! status: ${runResponse.status}`);
        console.log(finishedRun);
        return;
    }
    
    // Print out the run data
    const { id, name, status, flotime_ms, outputs } = finishedRun;

    console.log(`   RUN NAME: "${name}"`)
    console.log(`   RUN ID: ${id}`)
    console.log(`   RUN STATUS: ${status}`)
    console.log(`   RUN FLO TIME USED: ${flotime_ms}ms`)
    console.log(`   RUN OUTPUTS:`)
    outputs.forEach(output => {
        console.log(`     💾  ${output.file_name} (${output.mime_type} / ${output.size_bytes} bytes) - id: ${output.id}`)
        console.log(`         Presigned URL: ${output.presigned_url}`)
    });
}

floyoAPIDemo();