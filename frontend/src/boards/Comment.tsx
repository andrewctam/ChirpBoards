import { useContext, useEffect, useState } from "react"
import { UserContext } from "../App"
import { Post } from "./Board"
import ReplyBox from "./ReplyBox"
import Vote from "./Vote"

interface CommentProps extends Post {
    local: boolean
}

function Comment(props: CommentProps) {
    const [replies, setReplies] = useState<JSX.Element[]>([])
    //local replies are sent to the server, but also store them here to avoid a 2nd fetch
    const [localReplies, setLocalReplies] = useState<JSX.Element[]>([])

    const [pageNum, setPageNum] = useState(0);
    const [showReplies, setShowReplies] = useState(true)
    const [replying, setReplying] = useState(false)  


    const userInfo = useContext(UserContext);

    const loadMoreReplies = async () => {
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            post(id: "${props.id}") {
                comments(first:${pageNum}, offset:3) {
                    id
                    text
                    commentCount
                    postDate(timezone: ${timezone})
                    score
                    ${userInfo.state.username ? `voteStatus(username: "${userInfo.state.username}")` : ""}
                    author {
                        username
                        displayName
                    }
                }
            }
        }`

        
        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        
        console.log(response)
        
        const info = response.data.post;

        setPageNum(pageNum + 1)
        setReplies(replies.concat(
            info.comments.map((comment: any) => {
                return <Comment
                    key = {comment.id}
                    id = {comment.id}
                    text = {comment.text}
                    postDate = {comment.postDate}
                    authorUsername = {comment.author.username}
                    authorDisplayName = {comment.author.displayName}
                    commentCount = {comment.commentCount}
                    score = {comment.score}
                    voteStatus = {userInfo.state.username ? info.voteStatus : null}
                    local = {false}
                />
            }))
        )
    }


    return (
        <div className = "w-[95%] ml-[5%]">
            <div className = {`my-6 px-8 py-4 border border-black rounded-lg relative break-all bg-gray-100 ${props.local ? "animate-fadeColor": ""} `} >
                <div className = "block mb-3">
                    <a href={`/profile/${props.authorUsername}`}>
                        {props.authorDisplayName}
                        <div className="text-xs inline ml-1"> {`@${props.authorUsername}`} </div>
                    </a>
                    
                    <div className = "text-xs inline">
                        {` • ${props.postDate}`}
                    </div>
                </div>
                
                {props.text}

                {replying ? 
                <ReplyBox 
                    close = {() => {setReplying(false)}}
                    postId = {props.id}
                    addReply = {(reply) => {
                        setLocalReplies([reply, ...localReplies]); 
                    }}
                /> : null}

                <div className = "absolute -bottom-3 right-12">
                    {props.commentCount > 0 ?
                    <button className = {`bg-${showReplies ? "rose-100" : "gray-200"} text-black border border-black/20 rounded shadow-md text-xs mr-2 px-2 py-1`} 
                        onClick = {() => {setShowReplies(!showReplies)}}>

                        {`${showReplies ? "Hide " : "Show "} Replies`}
                    </button> : null}


                    {!replying ? 
                    <button className = "bg-gray-200 text-black border border-black/20 rounded shadow-md text-xs px-2 py-1" 
                        onClick = {() => {setReplying(true)}}>
                        Reply
                    </button> : null}
                   
                </div>

                <Vote postId = {props.id} initialScore = {props.score} initialVoteStatus = {props.voteStatus}/>
            </div>

            {showReplies ? 
                <div className = "w-full border-l border-l-white">
                    {localReplies.length > 0 ? localReplies.concat(replies) : replies}

                    {replies.length < props.commentCount ?
                        <p onClick = {loadMoreReplies} className = "cursor-pointer ml-[5%] text-sky-100">{`Load ${pageNum === 0 ? "" : "more"} replies`}</p>
                    : null}
                </div>
             : null}
        </div>
    )

}

export default Comment;