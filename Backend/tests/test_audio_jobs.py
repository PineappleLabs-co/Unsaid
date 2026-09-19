import pytest
import io
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_async_transcription_job_submission(client: AsyncClient):
    headers = {"X-Device-ID": "audio-device-1"}
    thought_id = str(uuid.uuid4())

    # Create thought
    await client.post(
        "/api/v1/thoughts",
        json={"id": thought_id, "raw_text": "Audio test note", "send_to_ai": False},
        headers=headers
    )

    # Submit multipart transcription job
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    files = {"file": ("test.wav", fake_audio, "audio/wav")}
    data = {"thought_id": thought_id}

    job_res = await client.post("/api/v1/audio/transcriptions", data=data, files=files, headers=headers)
    assert job_res.status_code == 202
    job_data = job_res.json()
    assert "job_id" in job_data
    assert job_data["status"] in ["queued", "processing", "complete"]

    # Poll transcription job
    poll_res = await client.get(f"/api/v1/audio/transcriptions/{job_data['job_id']}", headers=headers)
    assert poll_res.status_code == 200
    assert poll_res.json()["job_id"] == job_data["job_id"]
