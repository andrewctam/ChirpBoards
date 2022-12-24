import {useRef} from "react";

function Home() {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const createChirp = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (!inputRef || !inputRef.current)
            return;

        alert(inputRef.current.value)
        inputRef.current.value = "";
    }
    return (
       <div>
            <form onSubmit = {createChirp} className = "bg-stone-600 w-fit h-fit">
                <input ref = {inputRef} className = "bg-transparent h-fit" placeholder="Type to chirp!"/>
                <button className = "bg-gray-200 p-5" onClick = {createChirp}>Chirp</button>
            </form>
       </div>)
}

export default Home;
