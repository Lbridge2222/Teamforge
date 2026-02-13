"use client";

import { Fragment, type ReactNode } from "react";
import {
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X } from "@phosphor-icons/react/dist/ssr";

type SlideOutProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function SlideOut({ open, onClose, title, children }: SlideOutProps) {
  return (
    <Transition show={open} as={Fragment}>
      <div className="fixed inset-0 z-40 flex justify-end">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/20"
            onClick={onClose}
          />
        </TransitionChild>

        <TransitionChild
          as={Fragment}
          enter="transform transition ease-out duration-150"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition ease-in duration-100"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="relative w-full max-w-md bg-white border-l border-gray-200 overflow-y-auto shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-gray-100 px-6 py-4">
              {title && (
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ml-auto"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </div>
        </TransitionChild>
      </div>
    </Transition>
  );
}
