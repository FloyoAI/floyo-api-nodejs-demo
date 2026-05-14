# Floyo API Node.js Demo

This repository contains practical Node.js examples for common Floyo API workflows.

## Getting Started

1. Clone the repository:
   `git clone git@github.com:FloyoAI/floyo-api-nodejs-demo.git`
2. Install dependencies:
   `npm install`
3. Create your local environment file:
   `cp .env.example .env`
4. Open `.env` and set `API_KEY` with your Floyo API key.
5. Run any example from the `examples/` directory.

## Code Examples

1. [Run a basic workflow](/examples/run-workflow): `node examples/run-workflow` - Run the default ComfyUI workflow.
2. [Download a file](/examples/download-file/): `node examples/download-file` - Download a file from the CDN to local storage.
3. [Upload a file](/examples/upload-file/): `node examples/upload-file` - Upload a file to your team's `inputs` folder.
4. [Upload and run with input](/examples/upload-and-run-with-input/): `node examples/upload-and-run-with-input` - Upload an input file and use it in an image-to-image workflow run.

## Resources

- [Floyo API introduction](https://docs.floyo.ai/floyo-api-introduction)
- [Create and use API keys](https://docs.floyo.ai/getting-started#step-1-create-an-api-key)
- [Run workflows](https://docs.floyo.ai/workflow-runs)
- [Manage files](https://docs.floyo.ai/files)
