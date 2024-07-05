import { Flex } from '@radix-ui/themes'
import ProjectsSection from '../components/projects'
import ScenesSection from '../components/scenes'
import { useViewport } from '../../objective/hooks/useVieport'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from '../hooks/redux'
import { useSelector } from 'react-redux'
import { IProject, selectMyProjects, selectProject } from '../store/projects/reducer'
import { useEffect } from 'react'
import { loadProject, loadProjects, loadScenesFromLocalOrServer } from '../store/projects/actions'

const ProjectsPage = () => {
  const { projectId } = useParams()
  const { width } = useViewport()
  const isSmallViewPort = width <= 576

  const dispatch = useDispatch()
  const navigate = useNavigate()

  // [1] set projectId to path param, if it's not there
  // NOTE: this logic is only for not isSmallViewPort
  const projects = useSelector(selectMyProjects)
  const defaultProject = projects[0] as IProject | undefined
  const currentProject = useSelector(selectProject(projectId))

  useEffect(() => {
    if (!isSmallViewPort && !projectId && defaultProject) navigate(`/projects/${defaultProject.id}`)
  }, [isSmallViewPort, projectId, defaultProject])

  // [2] load projects and it's scenes
  // FIXME
  // here is might be double request for the same resource (for all scenes, and scene by id)
  // bu it's needed for now to invalidate external (other user's) scene data stored at local storage

  // load all user's projects (incl deleted)
  // it's required in order to set projectId in path parameters, if there no projects at all
  useEffect(() => {
    dispatch(loadProjects({ is_deleted: false }))
    dispatch(loadProjects({ is_deleted: true }))
  }, [dispatch])

  // load project from path parameters (curren/other user project)
  useEffect(() => {
    if (projectId) dispatch(loadProject({ id: projectId }))
  }, [projectId, dispatch])

  // load scenes full info for thumbnails (from project from path parameter)
  useEffect(() => {
    if (currentProject) dispatch(loadScenesFromLocalOrServer({ project_id: currentProject.id }))
  }, [currentProject, dispatch])

  return (
    <Flex style={{ height: 'calc(100% - 40px)' }}>
      {!isSmallViewPort || !projectId ? <ProjectsSection /> : null}
      {!isSmallViewPort || projectId ? <ScenesSection /> : null}
    </Flex>
  )
}

export default ProjectsPage
