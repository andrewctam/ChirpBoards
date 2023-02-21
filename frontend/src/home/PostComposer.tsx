import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";

function PostComposer() {
    const [composedChirp, setComposedChirp] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    const userInfo = useContext(UserContext);
    
    const updateComposedChirp = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = (e.target as HTMLTextAreaElement).value

        if (text.length > 500) {
            setComposedChirp(text.substring(0, 500))
            setErrorMsg("Character limit reached!")
            return
        }
        setErrorMsg("")
        setComposedChirp(text)
    }

    const createChirp = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (!userInfo.state.username) {
            navigate(`/signin?return=${window.location.pathname}`)
            return;
        }

        if (!composedChirp) {
            setErrorMsg("Text can not be blank!")
            return
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
            `mutation {
            createPost(text: """${composedChirp}""", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                post {
                    id
                }
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())

        console.log(response)

        if (!response.data.createPost) {
            alert("Error!")
            return
        }

        navigate(`/board/${response.data.createPost.post.id}`)
    }
    return (<form onSubmit={createChirp} className="w-full mb-12 bg-black/20 p-1 shadow-lg relative rounded">
        <textarea
            value={composedChirp}
            onChange={updateComposedChirp}
            className = "w-full h-40 bg-transparent p-2 resize-none focus:outline-none text-white"
            placeholder="Compose a chirp..." />

        <p className="text-white/75 text-xs ml-2 mb-2">
            {errorMsg ? errorMsg
                : `${composedChirp.length}/500 characters`}
        </p>

        <button className="bg-gray-300 disabled:bg-gray-400 disabled:text-black/50 text-xs sm:text-sm text-black border border-black rounded shadow-md absolute -bottom-3 right-4 px-4 py-2"
            onClick={createChirp}
            disabled = {composedChirp.length === 0}>
            Post
        </button>
    </form>)
}

export default PostComposer
