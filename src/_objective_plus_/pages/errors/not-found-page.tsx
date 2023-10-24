import { FC } from 'react'

const NotFoundPage: FC = () => {
  return (
    <div>
      <p className='mt-10 text text_type_main-large text_color_inactive'>404 Not Found</p>
      <p className='mt-2 text text_type_main-default text_color_inactive'>Такой страницы не существует :(</p>
    </div>
  )
}

export default NotFoundPage
