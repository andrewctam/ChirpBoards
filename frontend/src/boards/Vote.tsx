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
    const [currentSending, setCurrentSending] = useState<"upvote" | "downvote" | null>(null)
    const navigate = useNavigate();

    const vote = async (type: "upvote" | "downvote") => {
        if (!userInfo.state.username) {
            navigate(`/signin`)
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

        //optimistic update
        if (type === "upvote") {
            if (currentSending === "upvote")
                return;

            setCurrentSending("upvote");
            if (voteStatus === 1) { //undo upvote
                setVoteStatus(0);
                setScore(score - 1);
            } else if (voteStatus === -1) { //downvote to upvote
                setVoteStatus(1);
                setScore(score + 2);
            } else { //upvote
                setVoteStatus(1);
                setScore(score + 1);
            }
        } else {
            if (currentSending === "downvote")
                return;

            setCurrentSending("downvote");
            if (voteStatus === -1) { //undo downvote
                setVoteStatus(0);
                setScore(score + 1);
            } else if (voteStatus === 1) { //upvote to downvote
                setVoteStatus(-1);
                setScore(score - 2);
            } else { //downvote
                setVoteStatus(-1);
                setScore(score - 1);
            }
        }

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())
        console.log(response);

        setCurrentSending(null);
    }

    return (
        <div className="absolute right-0 top-0 bottom-0 h-fit text-white bg-transparent px-[3px] py-1 text-center text-sm">
            <div style={{ color: voteStatus === 1 ? "rgb(119 209 136)" : "white" }} onClick={() => { vote("upvote") }} className = "cursor-pointer">
                <UpArrow />
            </div>

            <div className = "select-none" style={{ color: 
                    voteStatus ===  1 ? "rgb(119 209 136)" :
                    voteStatus === -1 ? "rgb(218 133 133)" :
                                        "white" 
            }}>
                {formatScore(score)}
            </div>

            <div style={{ color: voteStatus === -1 ? "rgb(218 133 133)" : "white" }} onClick={() => { vote("downvote") }} className = "cursor-pointer">
                <DownArrow />
            </div>
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

const UpArrow = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M12 5l0 14"></path>
            <path d="M18 11l-6 -6"></path>
            <path d="M6 11l6 -6"></path>
        </svg>
    )
}

const DownArrow = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M12 5l0 14"></path>
            <path d="M18 13l-6 6"></path>
            <path d="M6 13l6 6"></path>
        </svg>
    )

}
export default Vote