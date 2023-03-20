import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserContext } from "../App"


interface VoteProps {
    postId: string
    initialScore: number
    initialVoteStatus: number | null
}


function Vote(props: VoteProps) {
    const userInfo = useContext(UserContext);
    const [score, setScore] = useState(props.initialScore)
    const [voteStatus, setVoteStatus] = useState(props.initialVoteStatus)

    const navigate = useNavigate();

    const vote = async (type: "upvote" | "downvote") => {
        if (!userInfo.state.username) {
            navigate(`/signin?return=${window.location.pathname}`)
            return;
        }

        if (props.postId === "EXAMPLE_CHIRP")
            return;

        const queryType = type + "Post"
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const query = 
        `mutation {
            ${queryType}(postId:"${props.postId}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                msg
                endRes
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({query})
        }).then(res => res.json())
        console.log(response)
        let info = response["data"][queryType]

        if (info.msg) {
            setVoteStatus(parseInt(info.msg))
        }

        
        setScore(info.endRes)
        console.log(response)
    }

    return (
        <div className="absolute right-1 top-0 h-fit bottom-0 text-white bg-transparent py-1 px-1 rounded-bl-xl text-center text-sm">
            <button style = { {color: voteStatus === 1 ? "rgb(119 209 136)" : "white"} } className = "font-extrabold" onClick = {() => {vote("upvote")}}>
            ↑
            </button>

            <div> {formatScore(score)} </div>

            <button style = { {color: voteStatus === -1 ? "rgb(218 133 133)" : "white"} } className = "font-extrabold" onClick = {() => {vote("downvote")}}>
            ↓
            </button>
        </div>
    )

}

const formatScore = (num: number): string => { 
    if (num < 1000)
        return num.toString();
    else if (num < 1000000)
        return Math.floor(num / 1000) + "k";
    else if (num < 1000000000)
        return Math.floor(num / 1000000) + "m";
    else 
        return ":)"
}
export default Vote