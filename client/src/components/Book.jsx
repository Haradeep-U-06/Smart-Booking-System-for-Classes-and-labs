import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'

function Book() {
    const { currentTeacher } = useContext(teacherContextObj)
    const { currentId } = useContext(idContextObj)
    console.log(currentTeacher, currentId)

    const [date, setDate] = useState('');
    const [slotsData, setSlotsData] = useState([]);

    async function fetchSlots() {
        if (!date) return;
        try {
            const result = await axios.get(`http://localhost:4000/classroom-api/available-slots/${date}`);
            setSlotsData(result.data.payload);
        } catch (err) {
            console.error("Error fetching slots:", err.message);
            alert("Failed to fetch slots. Please try again later.");
        }
    }

    async function handleBook(roomId, startTime, endTime) {
        try {
            await axios.post('http://localhost:4000/booking-api/bookings', {
                facultyId: currentId,
                facultyName: currentTeacher.name,
                email: currentTeacher.email,
                classroomId: roomId,
                date,
                startTime,
                endTime
            });
            alert('Slot booked successfully!');
            fetchSlots(); // Refresh after booking
        } catch (err) {
            console.error("Booking error:", err.message);
            alert("Booking failed. Please check your access or try again later.");
        }
    }

    useEffect(() => {
        if (date) fetchSlots();
    }, [date]);

    return (
        <div>
            <h2>Book a Slot</h2>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            {
                slotsData.map(room => (
                    <div key={room.roomId} style={{ margin: "20px", padding: "10px", border: "1px solid gray" }}>
                        <h3>{room.roomName} ({room.type} - Capacity: {room.capacity})</h3>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {
                                room.slots.map((slot, i) => (
                                    <div key={i} style={{
                                        border: "1px solid #ccc",
                                        padding: "8px",
                                        backgroundColor:
                                            slot.type === "Available" ? "green" :
                                            slot.type === "Canceled" ? "orange" : "red",
                                        color: "white",
                                        minWidth: "130px"
                                    }}>
                                        <div>{slot.startTime} - {slot.endTime}</div>
                                        <div>Status: {slot.type}</div>
                                        {slot.bookedBy && <div>By: {slot.bookedBy}</div>}
                                        {slot.available && (
                                            <button onClick={() => handleBook(room.roomId, slot.startTime, slot.endTime)}>Book</button>
                                        )}
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

export default Book;
