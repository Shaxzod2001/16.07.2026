import * as faceapi from '@vladmandic/face-api'
import type { Employee, MatchResult } from '../../../shared/types'

const MODEL_URL = `${import.meta.env.BASE_URL}models`

let modelsLoaded = false

interface TfBackendControls {
  setBackend(name: string): Promise<boolean>
  ready(): Promise<void>
}

const tf = faceapi.tf as unknown as TfBackendControls

async function selectBackend(): Promise<void> {
  let ok = false
  try {
    ok = await tf.setBackend('webgl')
  } catch {
    ok = false
  }
  if (!ok) {
    await tf.setBackend('cpu')
  }
  await tf.ready()
}

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return
  await selectBackend()
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
  ])
  modelsLoaded = true
}

export async function detectFaceDescriptor(
  input: HTMLVideoElement
): Promise<Float32Array | null> {
  const result = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
  return result?.descriptor ?? null
}

export function averageDescriptors(descriptors: Float32Array[]): number[] {
  const length = descriptors[0].length
  const sum = new Array(length).fill(0)
  for (const d of descriptors) {
    for (let i = 0; i < length; i++) sum[i] += d[i]
  }
  return sum.map((v) => v / descriptors.length)
}

const MATCH_THRESHOLD = 0.5

export function findBestMatch(
  descriptor: Float32Array,
  employees: Employee[]
): MatchResult | null {
  let best: MatchResult | null = null
  for (const employee of employees) {
    const stored = new Float32Array(JSON.parse(employee.descriptor) as number[])
    const distance = faceapi.euclideanDistance(descriptor, stored)
    if (!best || distance < best.distance) {
      best = { employee, distance }
    }
  }
  if (best && best.distance <= MATCH_THRESHOLD) return best
  return null
}
