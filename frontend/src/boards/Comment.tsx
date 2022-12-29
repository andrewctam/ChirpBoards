import { useEffect, useState } from "react"
import { Post } from "./Board"
import ReplyBox from "./ReplyBox"
import Vote from "./Vote"


function Comment(props: Post) {
    const [replies, setReplies] = useState<JSX.Element[]>([])
    const [pageNum, setPageNum] = useState(0);
    const [showReplies, setShowReplies] = useState(true)
    const [replying, setReplying] = useState(false)    

    const loadMoreReplies = async () => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            post(id: "${props.id}") {
                comments(first:${pageNum}, offset:3) {
                    id
                    text
                    commentCount
                    postDate
                    score
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
                />
            }))
        )
    }


    return (
        <div className = "w-[95%] ml-[5%]">
            <div className = "my-6 px-8 py-4 border border-black rounded-lg bg-white/50 relative break-all" >
                <div className = "block mb-3">
                    <a href = "./profile">
                        {props.authorDisplayName}
                    </a>
                    
                    <div className = "text-xs inline">
                        {` ${props.postDate}`} 
                    </div>
                </div>
                
                {props.text}

                {replying ? 
                <ReplyBox 
                    close = {() => {setReplying(false)}}
                    postId = {props.id}
                    addReply = {(reply) => setReplies([reply, ...replies])}
                /> : null}

                <div className = "absolute -bottom-3 right-6">
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

                <Vote postId = {props.id} score = {props.score}/>
            </div>

            {showReplies ? 
                <div className = "w-full border-l border-l-white">
                    {replies}

                    {replies.length < props.commentCount ?
                        <p onClick = {loadMoreReplies} className = "cursor-pointer ml-[5%] text-sky-100">{`Load ${pageNum === 0 ? "" : "more"} replies`}</p>
                    : null}
                </div>
             : null}
        </div>
    )

}

export default Comment;