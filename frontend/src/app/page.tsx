'use client'
import {useEffect} from "react";

export default function Home() {
    
    // on mount fetch rooms from the server
    useEffect(() => {
        fetch('http://localhost:3000/rooms')
            .then(response => response.json())
            .then(data => console.log(data));
    }, []);

    return (
        <div>
            <h1>Home</h1>
        </div>
    );
}
