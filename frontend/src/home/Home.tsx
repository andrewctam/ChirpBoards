import React, {useRef, useState} from "react";
import Layout from "../Layout";
import FeedButton from "./FeedButton";
import Chirp from "./Chirp";

export enum Feed {Following, Popular, MyChirps}

function Home() {
    const [chirps, setChirps] = useState<string[]>([]);
    const [composedChirp, setComposedChirp] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [feed, setFeed] = useState<Feed>(Feed.Following)

    const createChirp = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (!composedChirp) {
            setErrorMsg("Text can not be blank!")
            return
        }


        setChirps([...chirps, composedChirp])
        setFeed(Feed.MyChirps)
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

    return ( <Layout>
        <div className = "mt-8 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
                <form onSubmit = {createChirp} className = "w-full py-2 mb-12 bg-gray-100/20 border border-black/10 shadow-lg relative rounded">
                    <textarea 
                        value = {composedChirp} 
                        onChange = {updateComposedChirp} 
                        className = "bg-sky-200 border border-black/10 shadow rounded-xl resize-none px-6 pt-2 mt-2 ml-[-2%] w-[104%] h-24 focus:outline-none placeholder:text-black/75"
                        placeholder= "Compose a chirp..."/>

                    <p className = "text-white mb-4 ml-4">
                        {errorMsg ? errorMsg 
                        : `${composedChirp.length}/500 characters`}
                    </p>
                    
                    <button className = "bg-sky-200 text-black border border-black/10 rounded shadow-md absolute -bottom-3 right-4 px-4 py-2" 
                        onClick = {createChirp}>
                        Post
                    </button>
                </form>

                    
                <div className = "grid rows-2">
                    <div className = "grid grid-cols-3">
                            <FeedButton 
                                type = {Feed.Popular}
                                name = {"Popular"}
                                setFeed = {setFeed}
                                isActive = {feed === Feed.Popular} />
                            <FeedButton 
                                type = {Feed.Following}
                                name = {"Following"}
                                setFeed = {setFeed}
                                isActive = {feed === Feed.Following} />
                            <FeedButton 
                                type = {Feed.MyChirps}
                                name = {"My Chirps"}
                                setFeed = {setFeed}
                                isActive = {feed === Feed.MyChirps} />
                    </div>
                    <ul>   
                        {chirps.map((chirp => 
                        <Chirp 
                            author = {"Hello"}
                            date = {"Dec 26 2022, 9:45 PM"}
                            text = {chirp}
                        />))}
                    </ul>
                </div>
        </div>
    </Layout>)
}



export default Home;
