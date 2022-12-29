import { useContext, useState } from "react"
import { UserContext } from "../App"


interface VoteProps {
    postId: string
    score: number
}


function Vote(props: VoteProps) {
    const userInfo = useContext(UserContext);
    const [localChange, setLocalChange] = useState(0);

    const vote = async (type: "upvote" | "downvote") => {
        const queryType = type + "Post"
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = 
        `mutation {
            ${queryType}(postId:"${props.postId}", username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                error
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

        if (info.error) {
            alert(info.error)
            return;
        }

        if (queryType === "upvotePost") {
            if (info.endRes)
                setLocalChange(1)
            else
                setLocalChange(-1)
        } else {
            if (info.endRes)
                setLocalChange(-1)
            else
                setLocalChange(1)
        }

        console.log(response)
    }


    return (
        <div className="absolute -right-2 my-auto h-fit top-0 bottom-0 bg-gray-200 border border-black/20 py-1 px-2 rounded-xl text-center text-xs">
            <button className="" onClick = {() => {vote("upvote")}}>
            ↑
            </button>

            <div> {props.score + localChange} </div>

            <button className="" onClick = {() => {vote("downvote")}}>
            ↓
            </button>
        </div>
    )

}

export default Vote