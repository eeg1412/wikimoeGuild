import { parentPort, workerData } from 'worker_threads'
import { generateIconByObjectId } from '../icon-generator.js'

try {
  const result = generateIconByObjectId(workerData)
  parentPort.postMessage(result)
} catch (err) {
  parentPort.postMessage({ error: err.message })
}
