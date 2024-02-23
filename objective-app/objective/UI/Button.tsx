import clsx from 'clsx'
import { ButtonHTMLAttributes, FC, ReactNode } from 'react'

import './Button.scss'

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
}

/**
 * Simple Button.
 * But probably it's better to define a <div> with specific scss styles.
 * Otherwise it's more difficult to control element style.
 */
const Button: FC<IButtonProps> = (props) => {
  return (
    <button {...props} className={clsx('objective-button', props.className)}>
      <div>{props.icon}</div>
      {props.children}
    </button>
  )
}

export default Button
