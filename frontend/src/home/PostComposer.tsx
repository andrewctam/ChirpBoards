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
            navigate("/signin?return=true")
            return;
        }

        if (!composedChirp) {
            setErrorMsg("Text can not be blank!")
            return
        }

        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
            `mutation {
            createPost(text: "${composedChirp}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                post {
                    id
                }
            }
        }`

        console.log(JSON.stringify({ query }))

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
    return (<form onSubmit={createChirp} className="w-full py-2 mb-12 bg-gray-100/20 border border-black/10 shadow-lg relative rounded">
        <textarea
            value={composedChirp}
            onChange={updateComposedChirp}
            className="bg-sky-200 border border-black/10 shadow rounded-xl resize-none px-6 pt-2 mt-2 ml-[-2%] w-[104%] h-24 focus:outline-none placeholder:text-black/75"
            placeholder="Compose a chirp..." />

        <p className="text-white mb-4 ml-4">
            {errorMsg ? errorMsg
                : `${composedChirp.length}/500 characters`}
        </p>

        <button className="bg-sky-200 text-black border border-black/10 rounded shadow-md absolute -bottom-3 right-4 px-4 py-2"
            onClick={createChirp}>
            Post
        </button>
    </form>)
}

export default PostComposer
