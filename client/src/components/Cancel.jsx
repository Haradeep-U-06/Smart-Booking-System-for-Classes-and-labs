import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'

function Cancel() {
  const { currentTeacher } = useContext(teacherContextObj)
    const { currentId } = useContext(idContextObj)
    console.log(currentTeacher, currentId)

    const [date, setDate] = useState('');
    const [slotsData, setSlotsData] = useState([]);

    async function fetchSlots() {
        if (!date) return;
        try {
            const result = await axios.get(`http://localhost:4000/classroom-api/schedule/${date}`);
            setSlotsData(result.data.payload);
        } catch (err) {
            console.error("Error fetching slots:", err.message);
            alert("Failed to fetch slots. Please try again later.");
        }
    }

    async function handleCancel(roomId, startTime, endTime) {
      try {
        await axios.put(`http://localhost:4000/classroom-api/cancel-class/${roomId}`, {
            facultyId: currentId,
            date,
            startTime,
            endTime
        });
        alert('Slot canceled successfully!');
        fetchSlots(); // Refresh after booking
    } catch (err) {
        console.error("Cancellation error:", err.message);
        alert("Failed. Please check your access or try again later.");
    }
    }

    useEffect(() => {
        if (date) fetchSlots();
    }, [date]);

    return (
        <div>
            <h2>Cancel a pre-scheduled Slot</h2>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            {
                slotsData.map(room => (
                    <div key={room.roomId} style={{ margin: "20px", padding: "10px", border: "1px solid gray" }}>
                        <h3>{room.roomName} ({room.type} - Capacity: {room.capacity})</h3>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {
                                room.schedule.map((slot, i) => (
                                    <div key={i} style={{
                                        border: "1px solid #ccc",
                                        padding: "8px",
                                        backgroundColor:
                                            slot.type === "Scheduled" ? (Number(slot.facultyId) === Number(currentId) ? "green" : "red") : "red",
                                        color: "white",
                                        minWidth: "130px"
                                    }}>
                                        <div>{slot.startTime} - {slot.endTime}</div>
                                        <div>Status: {slot.type}</div>
                                        <div>By: {slot.facultyName}</div>
                                        {slot.type === "Scheduled" ? ((Number(slot.facultyId) === Number(currentId)) ? (
                                            <button onClick={() => handleCancel(room.roomId, slot.startTime, slot.endTime)}>Cancel</button>
                                        ) : <div></div>) : <div></div>}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default Cancel