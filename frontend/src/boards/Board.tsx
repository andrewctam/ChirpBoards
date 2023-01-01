import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { PostChirp, PostPayload, UserContext } from "../App"
import useScrollBottom from "../hooks/useScrollBottom"
import Layout from "../Layout"
import SpinningCircle from "../SpinningCircle"
import Comment from "./Comment"
import ReplyBox from "./ReplyBox"
import Sort, { SortMethod } from "./Sort"
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
    //local comments are sent to the server, but also store them here to avoid a 2nd fetch
    const [localComments, setLocalComments] = useState<JSX.Element[]>([])

    const [pageNum, setPageNum] = useState(0); //start at 1 because the first page is already loaded
    const [hasNextPage, setHasNextPage] = useState(true);
    const [replying, setReplying] = useState(false)
    const [sortMethod, setSortMethod] = useState<SortMethod>(SortMethod.New);

    const params = useParams();
    const navigate = useNavigate();

    const userInfo = useContext(UserContext);

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect( () => {
        if (searchParams && searchParams.get("sort") !== null) {
            switch(searchParams.get("sort")) {
                case "new":
                    setSortMethod(SortMethod.New)
                    break;
                case "score":
                    setSortMethod(SortMethod.Score)
                    break;
                default:
                    setSortMethod(SortMethod.New)
                    break;
            }
        }

        if (params && params.id) {
            fetchPost(params.id);
        }
    }, [] )

    useEffect(() => {
        //get comments after the main post loads
        if (mainPost && mainPost.commentCount > 0) {
            loadMoreComments();
        }
    }, [mainPost])

    useEffect(() => {
        //if the user updates sort method, reload to get the sorted board
        if (mainPost) {
            switch(sortMethod) {
                case SortMethod.New:
                    setSearchParams({sort: "new"})
                    break;
                case SortMethod.Score:
                    setSearchParams({sort: "score"})
                    break;
                default: break;
            }

            window.location.reload();
        }
    }, [sortMethod])

    
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
            userColor: info.author.userColor
        })

    }

    const loadMoreComments = async () => {
        if (!mainPost || !hasNextPage)
            return;

        let sort = "postDate";
        if (sortMethod === SortMethod.New)
            sort = "postDate";
        else if (sortMethod === SortMethod.Score)
            sort = "score";

        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query =
        `query {    
            post(id: "${mainPost.id}"${userInfo.state.username ? `, relatedUsername: "${userInfo.state.username}"` : ""}) {
                comments(pageNum:${pageNum}, size:10, sortMethod: "${sort}") {
                    posts {
                        id
                        text
                        commentCount
                        postDate(timezone: ${timezone})
                        score
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
                    voteStatus = {userInfo.state.username ? comment.voteStatus : 0}
                    local = {false}
                    autoLoadComments = {mainPost.commentCount < 10}
                    userColor = {comment.author.userColor}
                    sortMethod = {sortMethod}
                />
            }))
        )
    }



    useScrollBottom(loadMoreComments);

    return (
        <Layout>
            {mainPost ? 
            <div className = "mx-auto w-11/12 md:w-4/5 lg:w-3/4">
                <Sort sortMethod = {sortMethod} setSortMethod = {setSortMethod} />

                {mainPost.parentPost ? 
                    <div className = "mt-6 mb-6 ml-4">

                        {mainPost.rootPost && mainPost.parentPost !== mainPost.rootPost ?
                        <p className = "mb-2">
                            <a href={`/board/${mainPost.rootPost}`} className = "text-blue-400">← Top of the board</a>
                        </p>    
                        : null}

                        <p>
                            <a href={`/board/${mainPost.parentPost}`} className = "text-blue-200">← Parent comment</a>
                        </p>    
                    </div>
                : null}

                <div>
                    <div className = "w-full mt-6 mb-6 p-6 border border-black rounded-bl-xl rounded-tr-xl bg-black/50 text-white relative break-all">
                        <div className = "mb-3">
                            <a href={`/profile/${mainPost.authorUsername}`} className = "text-lg" style = {{color: mainPost.userColor}}>
                                {mainPost.authorDisplayName}
                            </a>

                            <a href={`/profile/${mainPost.authorUsername}`} className = "text-xs">
                                {` • @${mainPost.authorUsername}`}
                            </a>
                            
                            <div className = "text-xs inline">
                                {` • ${mainPost.postDate}`}
                            </div>
                        </div>

                        <div className = "whitespace-pre">
                            {mainPost.text}
                        </div>
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

            </div> 

            :
            <SpinningCircle />}
        </Layout>
    )


}


export default Board