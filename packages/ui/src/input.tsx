import React, { Dispatch, SetStateAction } from "react";

const input = ({
  placeholder,
  type,
  onClick,
  onChange,
  className,
}: {
  placeholder: string;
  type: string;
  onClick?: () => void;
  onChange?: (e: any) => void;
  className: string;
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      onClick={onClick}
      onChange={onChange}
      className={className}
    />
  );
};

export default input;
