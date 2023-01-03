import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { PostChirp, PostPayload, UserContext } from "../App"
import useOptions from "../hooks/useOptions"
import useScrollBottom from "../hooks/useScrollBottom"
import useSort from "../hooks/useSort"
import Layout from "../Layout"
import SpinningCircle from "../SpinningCircle"
import Comment from "./Comment"
import ReplyBox from "./ReplyBox"
import Vote from "./Vote"

export interface Post extends PostChirp {
    commentCount: number
    parentPost?: string | null
    rootPost?: string | null
    userColor: string
}


function Board() {
    const [mainPost, setMainPost] = useState<Post | null>(null)

    const [comments, setComments] = useState<JSX.Element[]>([])
    const [doneFetching, setDoneFetching] = useState(false);
    //local comments are sent to the server, but also store them here to avoid a 2nd fetch
    const [localComments, setLocalComments] = useState<JSX.Element[]>([])

    const [pageNum, setPageNum] = useState(0); //start at 1 because the first page is already loaded
    const [hasNextPage, setHasNextPage] = useState(true);
    const [replying, setReplying] = useState(false)
    
    const params = useParams();
    const navigate = useNavigate();
    
    const userInfo = useContext(UserContext);
    

    useEffect( () => {
        //on load, get the params
        if (params && params.id) {
            fetchPost(params.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )

    useEffect(() => {
        //get comments after the main post loads
        if (mainPost) {
            if (mainPost.commentCount > 0)
                getComments();
            else
                setDoneFetching(true)

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainPost])


    
    const fetchPost = async (postId: string) => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()

        const query =
        `query {    
            post(id: "${postId}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                author {
                    username
                    displayName
                    userColor
                }
                text
                parentPost {
                    id
                }
                rootPost {
                    id
                }
                isComment
                isEdited
                postDate(timezone: ${timezone})
                score
                commentCount
                ${userInfo.state.username ? "voteStatus" : ""}
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({query})
        }).then(res => res.json())
        console.log(response)

        if (response.errors || !response.data.post)
            navigate("/");

        const info: PostPayload = response.data.post;
        setMainPost({
            id: postId,
            text: info.text,
            voteStatus: userInfo.state.username ? info.voteStatus : 0,
            postDate: info.postDate,
            authorUsername: info.author.username,
            authorDisplayName: info.author.displayName,
            commentCount: info.commentCount,
            score: info.score,
            parentPost: info.parentPost ? info.parentPost.id : null,
            rootPost: info.rootPost ? info.rootPost.id : null,
            userColor: info.author.userColor,
            isEdited: info.isEdited
        })

    }

    const getComments = async () => {
        if (!mainPost || !hasNextPage) {
            setDoneFetching(true)
            return; 
        }

    
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            post(id: "${mainPost.id}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                comments(pageNum:${pageNum}, size:10, sortMethod: "${sortMethod}") {
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
        
        if (response.errors)
            navigate("/");
        
        const info = response.data.post;
        if (!info || info.isComment)
            navigate("/");

        setPageNum(pageNum + 1)
        setHasNextPage(info.comments.hasNext)

        setComments(comments.concat(
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
                    isEdited = {comment.isEdited}
                    voteStatus = {userInfo.state.username ? comment.voteStatus : 0}
                    local = {false}
                    autoLoadComments = {mainPost.commentCount < 10}
                    userColor = {comment.author.userColor}
                    sortMethod = {sortMethod}
                />
            }))
        )
        setDoneFetching(true);
    }


    const [sortMethod, sortBubble] = useSort(mainPost !== null, getComments, () => {
        setComments([])
        setLocalComments([])
        setPageNum(0)
        setHasNextPage(true);
    })

    useScrollBottom(async () => {
        setDoneFetching(false)
        await getComments()
    })

    const [dots, editor] = useOptions(
            mainPost ? mainPost.id : "",
            mainPost ? mainPost.text : "", 
            mainPost ? userInfo.state.username === mainPost.authorUsername : false,
            null,
            null)
            
    return (
        <Layout>
            {mainPost ? 
            <div className = "mx-auto w-11/12 md:w-4/5 lg:w-3/4">
                {sortBubble}

                {mainPost.parentPost ? 
                    <div className = "mt-6 mb-6 ml-4">

                        {mainPost.rootPost && mainPost.parentPost !== mainPost.rootPost ?
                        <p className = "mb-2">
                            <a href={`/board/${mainPost.rootPost}`} className = "text-blue-400">← Top of the board</a>
                        </p>    
                        : null}

                        <p>
                            <a href={`/board/${mainPost.parentPost}`} className = "text-blue-200">← Parent post</a>
                        </p>    
                    </div>
                : null}

                <div>
                    <div className = "w-full mt-6 mb-6 p-6 border border-black rounded-bl-xl rounded-tr-xl bg-black/10 text-white relative break-all">
                        <div className = "mb-3">
                            <a href={`/profile/${mainPost.authorUsername}`} className = "text-lg" style = {{color: mainPost.userColor}}>
                                {mainPost.authorDisplayName}
                            </a>

                            <a href={`/profile/${mainPost.authorUsername}`} className = "text-sm">
                                {` • @${mainPost.authorUsername}`}
                            </a>
                            
                            <div className = "text-sm inline">
                                {` • ${mainPost.postDate}`}
                            </div>

                            {mainPost.isEdited ? 
                                <div className = "text-sm inline italics">
                                    <span className = "text-white">
                                        {` • `}
                                    </span>
                                    <span className = "text-yellow-300">
                                        {`edited`}
                                    </span>
                                </div>
                            : null}     
                        </div>

                        {editor ? editor :
                        <div className = "whitespace-pre-line">
                            {mainPost.text}
                        </div>}

                        {dots}

                        <Vote postId = {mainPost.id} initialScore = {mainPost.score} initialVoteStatus = {mainPost.voteStatus}/>

                        
                        {replying ?
                        <ReplyBox 
                            postId = {mainPost.id} 
                            close = {() => {setReplying(false)}} 
                            sortMethod = {sortMethod}
                            addReply = {(reply) => {
                                setLocalComments([reply, ...localComments])
                            }}/> 
                        : 
                        <button className = "px-2 py-1 absolute -bottom-3 right-12 bg-[#b9cfe2] text-black border border-black/20 rounded shadow-md text-xs" 
                            onClick = {() => {setReplying(true)}}>
                                Reply
                        </button>
                        }
                    </div>
                </div>
                
                
                <div className = "w-full border-l mb-10 border-l-white">
                    {localComments.length > 0 ? localComments.concat(comments) : comments}
                </div>                

            </div> : null}

            {!doneFetching ? <SpinningCircle /> : null}
        </Layout>
    )


}


export default Board