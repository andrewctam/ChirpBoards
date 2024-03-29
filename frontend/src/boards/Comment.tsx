import { useContext, useEffect, useState } from "react"
import { UserContext, PostPayload } from "../App"
import { BoardInfo } from "./Board"
import ReplyBox from "./ReplyBox"
import Vote from "./Vote"
import useOptions from "../hooks/useOptions"
import PostBody from "../PostBody"

interface CommentProps extends BoardInfo {
    local: boolean
    autoLoadComments: boolean
    sortMethod: string
    sortDirection: string
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getReplies = async () => {
        if (!hasNextPage) 
            return;

        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = import.meta.env.DEV ? import.meta.env.VITE_DEV_URL : import.meta.env.VITE_PROD_URL
        const query =
        `query {    
            post(id: "${props.id}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                comments(pageNum:${pageNum}, size:3, sortMethod: "${props.sortMethod}", sortDirection: "${props.sortDirection}" ) {
                    posts {
                        id
                        text
                        commentCount
                        postDate(timezone: ${timezone})
                        score
                        isEdited
                        ${userInfo.state.username ? "voteStatus" : ""}
                        ${userInfo.state.username ? "rechirpStatus" : ""}
                        author {
                            username
                            displayName
                            userColor
                            pictureURL
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
        const info: PostPayload = response.data.post;
        

        setPageNum(pageNum + 1)
        setHasNextPage(info.comments.hasNext)

        setReplies(replies.concat(
            info.comments.posts.map((comment: PostPayload) => {
                return <Comment
                    key = {comment.id}
                    id = {comment.id}
                    text = {comment.text}
                    postDate = {comment.postDate}
                    imageURL = {""}
                    authorUsername = {comment.author.username}
                    authorDisplayName = {comment.author.displayName}
                    authorPictureURL = {comment.author.pictureURL}
                    commentCount = {comment.commentCount}
                    score = {comment.score}
                    voteStatus = {userInfo.state.username ? comment.voteStatus : 0}
                    rechirpStatus = {userInfo.state.username ? comment.rechirpStatus : false}
                    local = {false}
                    autoLoadComments = {false}
                    userColor = {comment.author.userColor}
                    sortMethod = {props.sortMethod}
                    sortDirection = {props.sortDirection}
                    isEdited = {info.isEdited}
                />
            }))
        )
    }

    const [dots, editor] = useOptions(props.id, props.text, userInfo.state.username === props.authorUsername, null, true, props.rechirpStatus)

    return (
        <div className = "w-[97.5%] ml-[2.5%]">
            <div className = {`my-6 rounded-bl-xl rounded-tr-xl relative break-all bg-black/20 shadow-md text-gray-100 ${props.local ? "animate-fadeColor": ""} `} >
                <PostBody
                    id = {props.id}
                    username = {props.authorUsername}
                    displayName = {props.authorDisplayName}
                    userColor = {props.userColor}
                    postDate = {props.postDate}
                    pictureURL = {props.authorPictureURL}
                    isEdited = {props.isEdited}
                    pinned = {false}
                    text = {props.text}
                    editor = {editor}
                    
                />
                    
                


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

            {replying ? 
                <ReplyBox 
                    close = {() => {setReplying(false)}}
                    postId = {props.id}
                    addReply = {(reply) => {
                        setLocalReplies([reply, ...localReplies]); 
                    }}
                    sortMethod = {props.sortMethod}
                    sortDirection = {props.sortDirection}
                    offset = {true}
            /> : null}

            {showReplies ? 
                <div className = "w-full border-l ml-[1px] border-l-gray-500">
                    {localReplies.length > 0 ? localReplies.concat(replies) : replies}

                    {replies.length < props.commentCount ?
                        <p onClick = {getReplies} className = "cursor-pointer ml-[2.5%] text-xs text-sky-100">{`Load ${pageNum === 0 ? "" : "more"} replies`}</p>
                    : null}
                </div>
             : null}


        </div>
    )

}

export default Comment;