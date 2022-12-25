import React, {useRef, useState} from "react";
import Layout from "../Layout";
function Home() {
    const [chirps, setChirps] = useState<string[]>([]);
    const [composedChirp, setComposedChirp] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    const [imageURL, setImageURL] = useState("");

    const createChirp = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (!composedChirp) {
            setErrorMsg("Text can not be blank!")
            return
        }

        setChirps([...chirps, composedChirp])
        setComposedChirp("")
        setErrorMsg("");
    }

    const updateComposedChirp = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = (e.target as HTMLTextAreaElement).value

        if (text.length > 500)  {
            setComposedChirp(text.substring(0, 500))
            setErrorMsg("Character limit reached!")
            return
        }
        setErrorMsg("")
        setComposedChirp(text)
    }

    const attachImage = (e: React.SyntheticEvent<HTMLInputElement> ) => {
        e.preventDefault();

        try {
            const files = (e.target as HTMLInputElement).files
            if (!files)
                return;

            const reader = new FileReader();

            reader.onloadend = () => {
                setImageURL((reader.result ?? "").toString())
            }
            
            reader.readAsDataURL(files[0]);
        } catch (error) {
            console.log(error);
        }
    }

    return ( <Layout>
        <div className = "mt-10">
                <form onSubmit = {createChirp} className = "bg-gray-100 border border-black/10 w-11/12 lg:w-3/4 mx-auto shadow-md relative rounded">
                        
                    <div className = "absolute -top-4 left-4 bg-gray-100 border border-black/10 p-2 rounded text-xl select-none text-center"
                        onClick = {() => {
                            if (textAreaRef.current)
                                textAreaRef.current.focus()
                        }}
                    >
                        Compose a Chirp Board
                    </div>
                    

                    <textarea 
                        value = {composedChirp} 
                        onChange = {updateComposedChirp} 
                        ref = {textAreaRef}
                        className = "bg-sky-200/90 border border-black/10 shadow rounded-xl resize-none p-2 mt-16 ml-[-2%] w-[104%] h-44 focus:outline-none placeholder:text-xl" 
                        placeholder=" . . ."/>

                    <p className = "text-rose-800/75 ml-2">{errorMsg}</p>

                    <img className = "mb-16 mx-auto" src = {imageURL} />
                    
                    {imageURL ? 
                        <button onClick = { () => setImageURL("") } className = "w-fit bg-rose-100 border border-black/10 rounded shadow-md absolute -bottom-3 left-4 p-1">
                            Remove Image
                        </button>   
                        :
                        <>
                            <label htmlFor = "imageUpload" className = "w-fit bg-gray-100 border border-black/10 rounded shadow-md absolute -bottom-3 left-4 p-1"
                            >
                                Attach Image
                            </label>

                            <input type = "file" onInput={attachImage} id = "imageUpload" className = "hidden" accept=".jpeg, .png"/>
                        </>
                    }

                    <button className = "bg-stone-800 text-white border border-black/10 rounded shadow-md absolute -bottom-3 right-4 px-4 py-2" onClick = {createChirp}>Post</button>
                </form>

                <ul>
                    {chirps.map((chirp => <li><div>{chirp}</div></li>))}
                </ul>

        </div>
    </Layout>)
}

export default Home;
