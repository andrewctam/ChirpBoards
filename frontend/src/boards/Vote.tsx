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
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
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
        <div className="absolute -right-5 my-auto h-fit top-0 bottom-0 text-black bg-[#c6e4e4] border border-black/20 py-1 px-1 w-12 rounded-xl text-center text-sm">
            <button style = { {color: voteStatus === 1 ? "rgb(0, 180, 0)" : "black"} } className = "font-extrabold" onClick = {() => {vote("upvote")}}>
            ↑
            </button>

            <div> {formatScore(score)} </div>

            <button style = { {color: voteStatus === -1 ? "red" : "black"} } className = "font-extrabold" onClick = {() => {vote("downvote")}}>
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