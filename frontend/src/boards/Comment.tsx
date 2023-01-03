import { useContext, useEffect, useState } from "react"
import { UserContext, PostPayload } from "../App"
import { Post } from "./Board"
import ReplyBox from "./ReplyBox"
import { SortMethod } from "../hooks/useSort"
import Vote from "./Vote"
import useOptions from "../hooks/useOptions"

interface CommentProps extends Post {
    local: boolean
    autoLoadComments: boolean
    sortMethod: string
}

function Comment(props: CommentProps) {
    const [replies, setReplies] = useState<JSX.Element[]>([])
    //local replies are sent to the server, but also store them here to avoid a 2nd fetch
    const [localReplies, setLocalReplies] = useState<JSX.Element[]>([])

    const [pageNum, setPageNum] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(true);

    const [showReplies, setShowReplies] = useState(true)
    const [replying, setReplying] = useState(false)  

    const userInfo = useContext(UserContext);

    useEffect(() => {
        if (props.autoLoadComments && props.commentCount > 0)
            getReplies();
    }, [])

    const getReplies = async () => {
        if (!hasNextPage) 
            return;

        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            post(id: "${props.id}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                comments(pageNum:${pageNum}, size:3, sortMethod: "${props.sortMethod}") {
                    posts {
                        id
                        text
                        commentCount
                        postDate(timezone: ${timezone})
                        score
                        isEdited
                        ${userInfo.state.username ? "voteStatus" : ""}
                        author {
                            username
                            displayName
                            userColor
                        }
                    }
                    hasNext
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
        setHasNextPage(info.comments.hasNext)

        setReplies(replies.concat(
            info.comments.posts.map((comment: PostPayload) => {
                return <Comment
                    key = {comment.id}
                    id = {comment.id}
                    text = {comment.text}
                    postDate = {comment.postDate}
                    authorUsername = {comment.author.username}
                    authorDisplayName = {comment.author.displayName}
                    commentCount = {comment.commentCount}
                    score = {comment.score}
                    voteStatus = {userInfo.state.username ? comment.voteStatus : 0}
                    local = {false}
                    autoLoadComments = {false}
                    userColor = {comment.author.userColor}
                    sortMethod = {props.sortMethod}
                    isEdited = {info.isEdited}
                />
            }))
        )
    }

    const [dots, editor] = useOptions(props.id, props.text, userInfo.state.username === props.authorUsername, null, null)

    return (
        <div className = "w-[95%] ml-[5%]">
            <div className = {`my-6 px-8 py-4 border border-black rounded-bl-xl rounded-tr-xl relative break-all bg-black/10 text-gray-100 ${props.local ? "animate-fadeColor": ""} `} >
                <div className = "inline mb-3 text-xs">
                    <a href={`/profile/${props.authorUsername}`} style = {{color: props.userColor}}>
                        {props.authorDisplayName}
                    </a>
                    <a href={`/profile/${props.authorUsername}`}>
                        {` • @${props.authorUsername}`}
                    </a>
                    <div className = "text-xs inline">
                        {` • ${props.postDate}`}
                    </div>

                    {props.isEdited ? 
                        <div className = "text-xs inline italics">
                            <span className = "text-white">
                                {` • `}
                            </span>
                            <span className = "text-yellow-300">
                                {`edited`}
                            </span>
                        </div>
                    : null}

                    <a className = "text-gray-200 ml-1" href = {`/board/${props.id}`}> ► </a>
                </div>
                
                { editor ? editor :
                <div className = "whitespace-pre-line mt-3">
                    {props.text}
                </div>
                }
                

                {replying ? 
                <ReplyBox 
                    close = {() => {setReplying(false)}}
                    postId = {props.id}
                    addReply = {(reply) => {
                        setLocalReplies([reply, ...localReplies]); 
                    }}
                    sortMethod = {props.sortMethod}
                /> : null}

                <div className = "absolute -bottom-3 right-12">
                    {props.commentCount > 0 ?
                    <button className = {`${showReplies ? "bg-rose-200" : "bg-gray-200"} text-black border border-black/20 rounded shadow-md text-xs mr-2 px-2 py-1`} 
                        onClick = {() => {setShowReplies(!showReplies)}}>

                        {`${showReplies ? "Hide " : "Show "} Replies`}
                    </button> : null}


                    {!replying ? 
                    <button className = "bg-[#b9cfe2] text-black border border-black/20 rounded shadow-md text-xs px-2 py-1" 
                        onClick = {() => {
                            setReplying(true)
                        }}>
                        Reply
                    </button> : null}
                </div>

                {dots}
                <Vote postId = {props.id} initialScore = {props.score} initialVoteStatus = {props.voteStatus}/>
            </div>

            {showReplies ? 
                <div className = "w-full border-l border-l-white">
                    {localReplies.length > 0 ? localReplies.concat(replies) : replies}

                    {replies.length < props.commentCount ?
                        <p onClick = {getReplies} className = "cursor-pointer ml-[5%] text-sky-100">{`Load ${pageNum === 0 ? "" : "more"} replies`}</p>
                    : null}
                </div>
             : null}
        </div>
    )

}

export default Comment;