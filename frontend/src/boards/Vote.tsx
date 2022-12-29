import { useContext, useState } from "react"
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

    const vote = async (type: "upvote" | "downvote") => {
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
        <div className="absolute -right-2 my-auto h-fit top-0 bottom-0 bg-gray-200 border border-black/20 py-1 px-2 rounded-xl text-center text-sm">
            <button style = { {color: voteStatus === 1 ? "rgb(100, 200, 100)" : "black"} } className = "font-extrabold" onClick = {() => {vote("upvote")}}>
            ↑
            </button>

            <div> {score} </div>

            <button style = { {color: voteStatus === -1 ? "red" : "black"} } className = "font-extrabold" onClick = {() => {vote("downvote")}}>
            ↓
            </button>
        </div>
    )

}

export default Vote